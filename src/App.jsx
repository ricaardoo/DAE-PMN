import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./data/db";
import { BODEGAS_INIT } from "./data/mockData";
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
  const [modalNueva, setModalNueva] = useState(false);
  const [detalleId, setDetalleId] = useState(null);

  // Consultas reactivas en tiempo real a IndexedDB (Dexie)
  const transferencias = useLiveQuery(() => db.transferencias.toArray());
  const stockList = useLiveQuery(() => db.stock.toArray());
  const log = useLiveQuery(() => db.logs.orderBy("id").reverse().limit(20).toArray());

  // Mapeo optimizado de existencias por Bodega y SKU
  const stock = useMemo(() => {
    if (!stockList) return {};
    const s = {};
    stockList.forEach((item) => {
      if (!s[item.bodegaId]) s[item.bodegaId] = {};
      s[item.bodegaId][item.sku] = {
        disp: item.disp,
        comp: item.comp,
        recl: item.recl,
        min: item.min,
      };
    });
    return s;
  }, [stockList]);

  // Captura de la transferencia seleccionada para despliegue de detalles
  const detalleT = useMemo(() => {
    if (!transferencias || !detalleId) return null;
    return transferencias.find((t) => t.id === detalleId) || null;
  }, [transferencias, detalleId]);

  // ─── LÓGICA DE ACCIONES ──────────────────────────────────────────────────
  
  const handleCrearTransferencia = async (data) => {
    const id = nextId(transferencias);
    const nueva = {
      id,
      ...data,
      solicitante: usuario.nombre,
      estado: data.requiereAprobacion ? "SOLICITADO" : "PREPARANDO",
      fechaCreacion: now(),
      fechaPreparando: data.requiereAprobacion ? null : now(),
      cantidadDespacho: data.cantidad,
    };

    await db.transaction("rw", db.transferencias, db.stock, db.logs, async () => {
      await db.transferencias.add(nueva);

      // Comprometer stock en origen
      const currentStock = await db.stock.get([data.origen, data.sku]);
      if (currentStock) {
        await db.stock.put({
          ...currentStock,
          disp: currentStock.disp - data.cantidad,
          comp: currentStock.comp + data.cantidad,
        });
      }

      const logMsg = data.requiereAprobacion
        ? `${id} creado (pendiente aprobación). ${data.cantidad} uds. ${data.sku} comprometidas en ${BODEGAS_INIT.find((b) => b.id === data.origen)?.nombre}.`
        : `${id} creado. ${data.cantidad} uds. ${data.sku} comprometidas en ${BODEGAS_INIT.find((b) => b.id === data.origen)?.nombre}.`;
      await db.logs.add({ ts: now(), msg: logMsg });
    });
  };

  const handleAccion = async (accion, params) => {
    const t = detalleT;
    if (!t) return;
    const ts = now();

    await db.transaction("rw", db.transferencias, db.stock, db.logs, async () => {
      let next = { ...t };
      let logMsg = "";

      if (accion === "APROBAR") {
        next.estado = "PREPARANDO";
        next.fechaPreparando = ts;
        logMsg = `${t.id}: Solicitud aprobada por supervisor.`;
      }

      if (accion === "CONFIRMAR_PICKING") {
        const cp = params.cantPicking;
        if (cp === t.cantidad) {
          next.estado = "PREPARADO";
          next.fechaPreparado = ts;
          next.cantidadDespacho = cp;
          logMsg = `${t.id}: Picking conforme. ${cp} uds. confirmadas.`;
        } else if (cp < t.cantidad && cp > 0) {
          next.estado = "DISCREPANCIA_PICKING";
          next.fechaDiscrepancia = ts;
          next.cantidadPicking = cp;
          logMsg = `${t.id}: Discrepancia picking. Físico: ${cp}, Solicitado: ${t.cantidad}.`;
        } else {
          next.estado = "ANULADO";
          next.fechaAnulado = ts;
          
          // devolver stock comprometido
          const currentStock = await db.stock.get([t.origen, t.sku]);
          if (currentStock) {
            const compToFree = Math.min(currentStock.comp, t.cantidad);
            await db.stock.put({
              ...currentStock,
              comp: currentStock.comp - compToFree,
              disp: currentStock.disp + compToFree,
            });
          }
          logMsg = `${t.id}: Anulado. Picking sin stock físico.`;
        }
      }

      if (accion === "ACEPTAR_PARCIAL") {
        // liberar la diferencia de stock comprometido
        const diff = t.cantidad - t.cantidadPicking;
        const currentStock = await db.stock.get([t.origen, t.sku]);
        if (currentStock) {
          await db.stock.put({
            ...currentStock,
            comp: currentStock.comp - diff,
            disp: currentStock.disp + diff,
          });
        }
        next.estado = "PREPARADO";
        next.fechaPreparado = ts;
        next.cantidadDespacho = t.cantidadPicking;
        next.cantidad = t.cantidadPicking;
        logMsg = `${t.id}: Transferencia parcial aceptada. Ajustado a ${t.cantidadPicking} uds.`;
      }

      if (accion === "FIRMAR_CUSTODIA") {
        next.estado = "EN_TRANSITO";
        next.fechaTransito = ts;
        next.operador = params.operador;
        // comp → trans (en stock lo marcamos visualmente liberando comp)
        const currentStock = await db.stock.get([t.origen, t.sku]);
        if (currentStock) {
          await db.stock.put({
            ...currentStock,
            comp: currentStock.comp - next.cantidadDespacho,
          });
        }
        logMsg = `${t.id}: En tránsito. Operador: ${params.operador}. Despacho: ${next.cantidadDespacho} uds.`;
      }

      if (accion === "CONFIRMAR_RECEPCION") {
        const danadas = params.cantDanada;
        const conformes = (next.cantidadDespacho ?? t.cantidad) - danadas;
        if (danadas === 0) {
          // Cierre normal
          next.estado = "CERRADO";
          next.fechaCierre = ts;
          
          // Sumar al destino 
          const destStock = await db.stock.get([t.destino, t.sku]);
          if (destStock) {
            await db.stock.put({
              ...destStock,
              disp: destStock.disp + (next.cantidadDespacho ?? t.cantidad),
            });
          }
          logMsg = `${t.id}: Cerrado. ${next.cantidadDespacho ?? t.cantidad} uds. recibidas en ${BODEGAS_INIT.find((b) => b.id === t.destino)?.nombre}.`;
        } else {
          // Con daño
          next.estado = "PENDIENTE_RECLAMO";
          next.fechaRecepcionParcial = ts;
          next.cantidadDanada = danadas;
          next.cantidadConforme = conformes;
          
          const destStock = await db.stock.get([t.destino, t.sku]);
          if (destStock) {
            await db.stock.put({
              ...destStock,
              disp: destStock.disp + conformes,
              recl: destStock.recl + danadas,
            });
          }
          logMsg = `${t.id}: Recepción con daño. ${conformes} conformes, ${danadas} en RECLAMO.`;
        }
      }

      if (accion === "RESOLVER_RECLAMO") {
        next.estado = "CERRADO_CON_INCIDENCIA";
        next.fechaCierre = ts;
        
        const destStock = await db.stock.get([t.destino, t.sku]);
        if (destStock) {
          if (params.decision === "REPONER") {
            await db.stock.put({
              ...destStock,
              disp: destStock.disp + t.cantidadDanada,
              recl: destStock.recl - t.cantidadDanada,
            });
            logMsg = `${t.id}: Reclamo resuelto. ${t.cantidadDanada} uds. repuestas.`;
          } else {
            await db.stock.put({
              ...destStock,
              recl: destStock.recl - t.cantidadDanada,
            });
            logMsg = `${t.id}: Reclamo resuelto. ${t.cantidadDanada} uds. dadas de baja.`;
          }
        }
      }

      if (accion === "ANULADO") {
        next.estado = "ANULADO";
        next.fechaAnulado = ts;
        
        // devolver stock comprometido
        const currentStock = await db.stock.get([t.origen, t.sku]);
        if (currentStock) {
          const cant = next.cantidadDespacho ?? t.cantidad;
          const compToFree = Math.min(currentStock.comp, cant);
          await db.stock.put({
            ...currentStock,
            comp: currentStock.comp - compToFree,
            disp: currentStock.disp + compToFree,
          });
        }
        logMsg = `${t.id}: ANULADO. Stock devuelto a disponible.`;
      }

      await db.transferencias.put(next);
      if (logMsg) {
        await db.logs.add({ ts: now(), msg: logMsg });
      }
    });
  };

  // Mostrar indicador de carga si la BD no ha poblado los almacenes iniciales
  if (!transferencias || !stockList || !log) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5, color: "#6366f1" }}>INICIALIZANDO BASE DE DATOS...</div>
      </div>
    );
  }

  // ─── LOGIN / SELECCIÓN DE PERFIL SIMULADO ──────────────────────────────────
  if (!usuario) {
    return <Landing setUsuario={setUsuario} />;
  }

  // ─── APP PRINCIPAL CONTROLADA POR ROLES ────────────────────────────────────
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "inventario", label: "Inventario" },
    { id: "auditoria", label: "Auditoría" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Outfit:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Navbar con Identificación de Sesión de Usuario Activo */}
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
        
        {/* Badge Informativo del Perfil Activo (Requisito de Autenticidad) */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 700 }}>{usuario.nombre}</div>
            <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 600 }}>{usuario.rolLabel}</div>
          </div>
          <button onClick={() => { setUsuario(null); setPantalla("dashboard"); }} style={{
            background: "#1f2937", border: "1px solid #374151", color: "#9ca3af",
            borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace"
          }}>Salir</button>
        </div>
      </div>

      {/* Contenido Modularizado */}
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

      {/* Modal Nueva Solicitud (Sujeto a validación interna por props) */}
      {modalNueva && (
        <NuevaSolicitud
          onClose={() => setModalNueva(false)}
          onCrear={handleCrearTransferencia}
          stock={stock}
          bodegas={BODEGAS_INIT}
          usuario={usuario}
        />
      )}

      {/* Modal Detalle Operacional (Seguridad de transiciones por rol) */}
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