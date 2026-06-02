import { useState, useMemo } from "react";
import { CATALOGOS, BODEGAS_INIT } from "../data/mockData";
import { Btn, Badge } from "./Common";

export default function Dashboard({ transferencias, stock, bodegas, onNueva, onVerDetalle, usuario }) {
  // Estados para la barra de herramientas avanzada
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busquedaSku, setBusquedaSku] = useState("");

  const activas = transferencias.filter(t => !["CERRADO", "CERRADO_CON_INCIDENCIA", "ANULADO"].includes(t.estado));
  const cerradas = transferencias.filter(t => t.estado === "CERRADO" || t.estado === "CERRADO_CON_INCIDENCIA");

  // 1. ALERTAS DE STOCK CRÍTICO EN TIEMPO REAL
  const alertas = [];
  bodegas.forEach(b => {
    Object.entries(stock[b.id] || {}).forEach(([sku, s]) => {
      if (s.disp < s.min) {
        const prod = CATALOGOS.find(c => c.sku === sku);
        alertas.push({ bodega: b.nombre, sku, prod: prod?.nombre, disp: s.disp, min: s.min });
      }
    });
  });

  // 2. FILTRADO INTELIGENTE REACTIVO (Cruza filtros manuales y criterios de búsqueda)
  const transferenciasFiltradas = useMemo(() => {
    // Invertimos el orden para ver las más recientes primero
    let lista = [...transferencias].reverse();

    return lista.filter(t => {
      // Filtro A: Búsqueda por SKU
      if (busquedaSku && !t.sku.toLowerCase().includes(busquedaSku.toLowerCase())) {
        return false;
      }
      // Filtro B: Selectores de Estado
      if (filtroEstado !== "TODOS") {
        if (filtroEstado === "INCIDENCIAS") {
          return ["DISCREPANCIA_PICKING", "PENDIENTE_RECLAMO", "CERRADO_CON_INCIDENCIA"].includes(t.estado);
        }
        if (filtroEstado === "ACCIONABLE") {
          return (t.estado === "SOLICITADO" && usuario.rol === "SUPERVISOR") ||
                 (t.estado === "PREPARANDO" && usuario.rol === "ENCARGADO_ORIGEN") ||
                 (t.estado === "DISCREPANCIA_PICKING" && usuario.rol === "SOLICITANTE") ||
                 (t.estado === "PREPARADO" && usuario.rol === "OPERADOR") ||
                 (t.estado === "EN_TRANSITO" && usuario.rol === "ENCARGADO_DESTINO") ||
                 (t.estado === "PENDIENTE_RECLAMO" && usuario.rol === "SUPERVISOR");
        }
        return t.estado === filtroEstado;
      }
      return true;
    });
  }, [transferencias, filtroEstado, busquedaSku, usuario.rol]);

  return (
    <div style={{ fontFamily: "'DM Mono', monospace" }}>
      
      {/* Tarjetas de Mando Logístico (KPIs) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Transferencias Activas", val: activas.length, color: "#3b82f6", filterKey: "TODOS" },
          { label: "Cerradas Totales", val: cerradas.length, color: "#22c55e", filterKey: "CERRADO" },
          { label: "Alertas de Stock", val: alertas.length, color: "#ef4444", filterKey: "TODOS" },
          { label: "En Tránsito", val: transferencias.filter(t => t.estado === "EN_TRANSITO").length, color: "#f97316", filterKey: "EN_TRANSITO" },
        ].map((m, i) => (
          <div key={i} 
               onClick={() => setFiltroEstado(m.filterKey)}
               style={{ background: "#1a1f2e", border: filtroEstado === m.filterKey ? `1px solid ${m.color}` : `1px solid ${m.color}33`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Alertas de Stock Mínimo en Caliente */}
      {alertas.length > 0 && (
        <div style={{ background: "#ef444410", border: "1px solid #ef444433", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>⚠ Alertas de Stock Mínimo en Bodega</div>
          {alertas.map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: "#fca5a5", marginBottom: 4 }}>
              📌 {a.bodega} — {a.prod} (<span style={{ fontFamily: "inherit", fontWeight: 700 }}>{a.sku}</span>): cuenta con <strong>{a.disp}</strong> uds. (mínimo exigido: {a.min})
            </div>
          ))}
        </div>
      )}

      {/* BARRA DE HERRAMIENTAS Y FILTRADO CONTROLADO */}
      <div style={{ background: "#1a1f2e", border: "1px solid #2d3550", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        
        {/* Buscador de SKU */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: "180px" }}>
          <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Buscar Código SKU</span>
          <input type="text" value={busquedaSku} onChange={e => setBusquedaSku(e.target.value)} placeholder="Ej: SKU-1001" style={{ background: "#0f1520", border: "1px solid #2d3550", color: "#e2e8f0", padding: "6px 10px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
        </div>

        {/* Selector de Estado Operacional */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "200px" }}>
          <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Filtrar por Fase</span>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ background: "#0f1520", border: "1px solid #2d3550", color: "#e2e8f0", padding: "6px 10px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none" }}>
            <option value="TODOS">-- TODOS LOS ESTADOS --</option>
            <option value="ACCIONABLE">⚡ REQUERIDO PARA TU ROL</option>
            <option value="SOLICITADO">SOLICITADO (Por Aprobar)</option>
            <option value="PREPARANDO">PREPARANDO (En Conteo)</option>
            <option value="DISCREPANCIA_PICKING">DISCREPANCIA PICKING</option>
            <option value="PREPARADO">PREPARADO (Por Retirar)</option>
            <option value="EN_TRANSITO">EN TRÁNSITO (En Ruta)</option>
            <option value="PENDIENTE_RECLAMO">PENDIENTE RECLAMO</option>
            <option value="INCIDENCIAS">⚠️ TODAS LAS ALERTAS</option>
            <option value="CERRADO">CERRADO (Conforme)</option>
            <option value="CERRADO_CON_INCIDENCIA">CERRADO CON INCIDENCIA</option>
            <option value="ANULADO">ANULADO</option>
          </select>
        </div>
      </div>

      {/* Cabecera de la Sección de Registros */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" }}>
          Órdenes Logísticas Registradas ({transferenciasFiltradas.length})
        </span>
        {(usuario.rol === "SOLICITANTE" || usuario.rol === "ADMIN") && (
          <Btn onClick={onNueva} small>+ Nueva Solicitud</Btn>
        )}
      </div>

      {/* Tabla General Saneada */}
      <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #2d3550", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2d3550" }}>
              {["ID / Alerta", "SKU / Producto", "Cant.", "Origen → Destino", "Estado", "Fecha", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transferenciasFiltradas.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#4b5563", fontSize: 13, fontStyle: "italic" }}>No se encontraron transferencias con los criterios de búsqueda actuales.</td></tr>
            )}
            {transferenciasFiltradas.map(t => {
              const prod = CATALOGOS.find(c => c.sku === t.sku);
              const bodOri = bodegas.find(b => b.id === t.origen);
              const bodDes = bodegas.find(b => b.id === t.destino);

              // Validador en caliente si esta orden está retenida esperando una firma directa del usuario activo
              const requiereAtencionUsuario = 
                (t.estado === "SOLICITADO" && usuario.rol === "SUPERVISOR") ||
                (t.estado === "PREPARANDO" && usuario.rol === "ENCARGADO_ORIGEN") ||
                (t.estado === "DISCREPANCIA_PICKING" && usuario.rol === "SOLICITANTE") ||
                (t.estado === "PREPARADO" && usuario.rol === "OPERADOR") ||
                (t.estado === "EN_TRANSITO" && usuario.rol === "ENCARGADO_DESTINO") ||
                (t.estado === "PENDIENTE_RECLAMO" && usuario.rol === "SUPERVISOR");

              return (
                <tr key={t.id} style={{ borderBottom: "1px solid #1e2535", transition: "background 0.1s", background: requiereAtencionUsuario ? "#6366f108" : "transparent" }}
                  onMouseEnter={e => e.currentTarget.style.background = requiereAtencionUsuario ? "#6366f115" : "#ffffff08"}
                  onMouseLeave={e => e.currentTarget.style.background = requiereAtencionUsuario ? "#6366f108" : "transparent"}>
                  
                  {/* ID e indicador visual de acción por rol */}
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                    {t.id}
                    {requiereAtencionUsuario && (
                      <div style={{ fontSize: 8, background: "#312e81", color: "#a5b4fc", border: "1px solid #4338ca", padding: "1px 4px", borderRadius: 4, width: "fit-content", marginTop: 4, fontWeight: 700 }}>
                        ⚡ ACCIONAR
                      </div>
                    )}
                  </td>
                  
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#e2e8f0" }}>
                    <span style={{ color: "#6b7280", fontSize: 10 }}>{t.sku}</span><br/>{prod?.nombre}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>
                    {t.cantidadDespacho ?? t.cantidad}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#9ca3af" }}>
                    {bodOri?.nombre || t.origen} → {bodDes?.nombre || t.destino}
                  </td>
                  <td style={{ padding: "10px 14px" }}><Badge estado={t.estado} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#6b7280" }}>{t.fechaCreacion}</td>
                  <td style={{ padding: "10px 14px" }}><Btn small variant="ghost" onClick={() => onVerDetalle(t)}>Ver</Btn></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}