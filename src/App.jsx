import { useState } from "react";
import { BODEGAS_INIT, STOCK_INIT, TRANSFERENCIAS_INIT } from "./data/mockData";
import { now, nextId } from "./utils/helpers";
import { Modal } from "./components/Common";
import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";
import Inventario from "./components/Inventario";
import DetalleTransferencia from "./components/DetalleTransferencia";
import NuevaSolicitud from "./components/NuevaSolicitud";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [pantalla, setPantalla] = useState("dashboard");
  const [transferencias, setTransferencias] = useState(TRANSFERENCIAS_INIT);
  const [stock, setStock] = useState(STOCK_INIT);
  const [modalNueva, setModalNueva] = useState(false);
  const [detalleId, setDetalleId] = useState(null);
  const detalleT = transferencias.find(t => t.id === detalleId);
  const [log, setLog] = useState([
    { ts: "06/05/2026 17:10", msg: "ST-2026-001 cerrado exitosamente. Bodega Norte +40 uds. SKU-4421." }
  ]);

  const addLog = (msg) => setLog(prev => [{ ts: now(), msg }, ...prev.slice(0, 19)]);

  // ─── LÓGICA DE ACCIONES ──────────────────────────────────────────────────
  const handleCrearTransferencia = (data) => {
    const id = nextId(transferencias);
    const nueva = {
      id, ...data,
      solicitante: usuario.nombre,
      estado: data.requiereAprobacion ? "SOLICITADO" : "PREPARANDO",
      fechaCreacion: now(),
      fechaPreparando: data.requiereAprobacion ? null : now(),
      cantidadDespacho: data.cantidad,
    };

    setTransferencias(prev => [...prev, nueva]);

    // Comprometer stock en origen
    setStock(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      s[data.origen][data.sku].disp -= data.cantidad;
      s[data.origen][data.sku].comp += data.cantidad;
      return s;
    });

    if (data.requiereAprobacion) {
      addLog(`${id} creado (pendiente aprobación). ${data.cantidad} uds. ${data.sku} comprometidas en ${BODEGAS_INIT.find(b=>b.id===data.origen)?.nombre}.`);
    } else {
      addLog(`${id} creado. ${data.cantidad} uds. ${data.sku} comprometidas en ${BODEGAS_INIT.find(b=>b.id===data.origen)?.nombre}.`);
    }
  };

  const handleAccion = (accion, params) => {
    const t = detalleT;
    const ts = now();

    setTransferencias(prev => prev.map(tr => {
      if (tr.id !== t.id) return tr;
      let next = { ...tr };

      if (accion === "APROBAR") {
        next.estado = "PREPARANDO";
        next.fechaPreparando = ts;
        addLog(`${tr.id}: Solicitud aprobada por supervisor.`);
      }

      if (accion === "CONFIRMAR_PICKING") {
        const cp = params.cantPicking;
        if (cp === tr.cantidad) {
          next.estado = "PREPARADO";
          next.fechaPreparado = ts;
          next.cantidadDespacho = cp;
          addLog(`${tr.id}: Picking conforme. ${cp} uds. confirmadas.`);
        } else if (cp < tr.cantidad && cp > 0) {
          next.estado = "DISCREPANCIA_PICKING";
          next.fechaDiscrepancia = ts;
          next.cantidadPicking = cp;
          addLog(`${tr.id}: Discrepancia picking. Físico: ${cp}, Solicitado: ${tr.cantidad}.`);
        } else {
          next.estado = "ANULADO";
          next.fechaAnulado = ts;
          addLog(`${tr.id}: Anulado. Picking sin stock físico.`);
        }
      }

      if (accion === "ACEPTAR_PARCIAL") {
        // liberar la diferencia de stock comprometido
        setStock(prev2 => {
          const s = JSON.parse(JSON.stringify(prev2));
          const diff = tr.cantidad - tr.cantidadPicking;
          s[tr.origen][tr.sku].comp -= diff;
          s[tr.origen][tr.sku].disp += diff;
          return s;
        });
        next.estado = "PREPARADO";
        next.fechaPreparado = ts;
        next.cantidadDespacho = tr.cantidadPicking;
        next.cantidad = tr.cantidadPicking;
        addLog(`${tr.id}: Transferencia parcial aceptada. Ajustado a ${tr.cantidadPicking} uds.`);
      }

      if (accion === "FIRMAR_CUSTODIA") {
        next.estado = "EN_TRANSITO";
        next.fechaTransito = ts;
        next.operador = params.operador;
        // comp → trans (en stock lo marcamos visualmente liberando comp)
        setStock(prev2 => {
          const s = JSON.parse(JSON.stringify(prev2));
          s[tr.origen][tr.sku].comp -= next.cantidadDespacho;
          return s;
        });
        addLog(`${tr.id}: En tránsito. Operador: ${params.operador}. Despacho: ${next.cantidadDespacho} uds.`);
      }

      if (accion === "CONFIRMAR_RECEPCION") {
        const danadas = params.cantDanada;
        const conformes = (next.cantidadDespacho ?? tr.cantidad) - danadas;
        if (danadas === 0) {
          // Cierre normal
          next.estado = "CERRADO";
          next.fechaCierre = ts;
          setStock(prev2 => {
            const s = JSON.parse(JSON.stringify(prev2));
            s[tr.origen][tr.sku].disp -= (next.cantidadDespacho ?? tr.cantidad);
            // En origen ya se descontó al comprometer, aquí solo ajustamos destino
            s[tr.destino][tr.sku].disp += (next.cantidadDespacho ?? tr.cantidad);
            return s;
          });
          addLog(`${tr.id}: Cerrado. ${next.cantidadDespacho ?? tr.cantidad} uds. recibidas en ${BODEGAS_INIT.find(b=>b.id===tr.destino)?.nombre}.`);
        } else {
          // Con daño
          next.estado = "PENDIENTE_RECLAMO";
          next.fechaRecepcionParcial = ts;
          next.cantidadDanada = danadas;
          next.cantidadConforme = conformes;
          setStock(prev2 => {
            const s = JSON.parse(JSON.stringify(prev2));
            s[tr.destino][tr.sku].disp += conformes;
            s[tr.destino][tr.sku].recl += danadas;
            return s;
          });
          addLog(`${tr.id}: Recepción con daño. ${conformes} conformes, ${danadas} en RECLAMO.`);
        }
      }

      if (accion === "RESOLVER_RECLAMO") {
        next.estado = "CERRADO_CON_INCIDENCIA";
        next.fechaCierre = ts;
        if (params.decision === "REPONER") {
          setStock(prev2 => {
            const s = JSON.parse(JSON.stringify(prev2));
            s[tr.destino][tr.sku].disp += tr.cantidadDanada;
            s[tr.destino][tr.sku].recl -= tr.cantidadDanada;
            return s;
          });
          addLog(`${tr.id}: Reclamo resuelto. ${tr.cantidadDanada} uds. repuestas.`);
        } else {
          setStock(prev2 => {
            const s = JSON.parse(JSON.stringify(prev2));
            s[tr.destino][tr.sku].recl -= tr.cantidadDanada;
            return s;
          });
          addLog(`${tr.id}: Reclamo resuelto. ${tr.cantidadDanada} uds. dadas de baja.`);
        }
      }

      if (accion === "ANULADO") {
        next.estado = "ANULADO";
        next.fechaAnulado = ts;
        // devolver stock comprometido
        setStock(prev2 => {
          const s = JSON.parse(JSON.stringify(prev2));
          const comp = s[tr.origen][tr.sku].comp;
          const cant = next.cantidadDespacho ?? tr.cantidad;
          s[tr.origen][tr.sku].comp -= Math.min(comp, cant);
          s[tr.origen][tr.sku].disp += Math.min(comp, cant);
          return s;
        });
        addLog(`${tr.id}: ANULADO. Stock devuelto a disponible.`);
      }

      return next;
    }));
  };

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  if (!usuario) {
    return <Landing setUsuario={setUsuario} />;
  }

  // ─── APP PRINCIPAL ───────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "inventario", label: "Inventario" },
    { id: "auditoria", label: "Auditoría" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Outfit:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Navbar */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "0 24px", display: "flex", alignItems: "center", gap: 24, height: 52 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#6366f1", fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap" }}>ControlBod.</div>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setPantalla(n.id)} style={{
            background: "none", border: "none", color: pantalla === n.id ? "#e2e8f0" : "#6b7280",
            fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
            borderBottom: pantalla === n.id ? "2px solid #3b82f6" : "2px solid transparent",
            padding: "15px 2px", transition: "all 0.15s", fontFamily: "'DM Mono', monospace"
          }}>
            {n.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 700 }}>{usuario.nombre}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>{usuario.rolLabel}</div>
          </div>
          <button onClick={() => setUsuario(null)} style={{
            background: "#1f2937", border: "1px solid #374151", color: "#9ca3af",
            borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace"
          }}>Salir</button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Outfit', sans-serif" }}>
            {pantalla === "dashboard" && "Dashboard de Transferencias"}
            {pantalla === "inventario" && "Estado de Inventario"}
            {pantalla === "auditoria" && "Log de Auditoría"}
          </div>
        </div>

        {pantalla === "dashboard" && (
          <Dashboard
            transferencias={transferencias}
            stock={stock}
            bodegas={BODEGAS_INIT}
            onNueva={() => setModalNueva(true)}
            onVerDetalle={t => setDetalleId(t.id)}
            usuario={usuario}
          />
        )}

        {pantalla === "inventario" && (
          <Inventario stock={stock} bodegas={BODEGAS_INIT} />
        )}

        {pantalla === "auditoria" && (
          <div style={{ background: "#1a1f2e", border: "1px solid #2d3550", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #2d3550", fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Registro de Eventos — {log.length} eventos
            </div>
            {log.length === 0 && <div style={{ padding: 24, color: "#4b5563", textAlign: "center", fontSize: 13 }}>Sin eventos registrados</div>}
            {log.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "10px 18px", borderBottom: "1px solid #1e2535", fontSize: 12 }}>
                <span style={{ color: "#6b7280", whiteSpace: "nowrap", fontSize: 11 }}>{e.ts}</span>
                <span style={{ color: "#d1d5db" }}>{e.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nueva Solicitud */}
      {modalNueva && (
        <NuevaSolicitud
          onClose={() => setModalNueva(false)}
          onCrear={handleCrearTransferencia}
          stock={stock}
          bodegas={BODEGAS_INIT}
          usuario={usuario}
        />
      )}

      {/* Modal Detalle */}
      {detalleT && (
        <Modal title={`DETALLE — ${detalleT.id}`} onClose={() => setDetalleId(null)}>
          <DetalleTransferencia
            t={detalleT}
            onAccion={(accion, params) => {
              handleAccion(accion, params);
              setDetalleId(null);
            }}
            usuario={usuario}
          />
        </Modal>
      )}
    </div>
  );
}
