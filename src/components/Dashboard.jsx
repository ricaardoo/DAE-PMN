import { useState, useMemo } from "react";
import { CATALOGOS, ESTADO_COLOR } from "../data/mockData";
import { Btn, Badge, AnimatedCount, SparkLine, EmptyState } from "./Common";

const ITEMS_PER_PAGE = 8;

export default function Dashboard({ transferencias, stock, bodegas, onNueva, onVerDetalle, usuario }) {
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busquedaSku, setBusquedaSku] = useState("");
  const [pagina, setPagina] = useState(1);

  const activas = transferencias.filter(t => !["CERRADO", "CERRADO_CON_INCIDENCIA", "ANULADO"].includes(t.estado));
  const cerradas = transferencias.filter(t => t.estado === "CERRADO" || t.estado === "CERRADO_CON_INCIDENCIA");
  const enTransito = transferencias.filter(t => t.estado === "EN_TRANSITO");

  // Alertas de Stock Crítico
  const alertas = [];
  bodegas.forEach(b => {
    Object.entries(stock[b.id] || {}).forEach(([sku, s]) => {
      if (s.disp < s.min) {
        const prod = CATALOGOS.find(c => c.sku === sku);
        alertas.push({ bodega: b.nombre, bodegaColor: b.color, sku, prod: prod?.nombre, disp: s.disp, min: s.min, pct: Math.round((s.disp / s.min) * 100) });
      }
    });
  });

  // Filtrado inteligente
  const transferenciasFiltradas = useMemo(() => {
    let lista = [...transferencias].reverse();
    return lista.filter(t => {
      if (busquedaSku && !t.sku.toLowerCase().includes(busquedaSku.toLowerCase()) && !t.id.toLowerCase().includes(busquedaSku.toLowerCase())) return false;
      if (filtroEstado !== "TODOS") {
        if (filtroEstado === "INCIDENCIAS") return ["DISCREPANCIA_PICKING", "PENDIENTE_RECLAMO", "CERRADO_CON_INCIDENCIA"].includes(t.estado);
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

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(transferenciasFiltradas.length / ITEMS_PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const itemsPagina = transferenciasFiltradas.slice((paginaActual - 1) * ITEMS_PER_PAGE, paginaActual * ITEMS_PER_PAGE);

  // Datos simulados para sparklines
  const sparkData = {
    activas: [2, 3, 5, 4, 6, activas.length],
    cerradas: [0, 1, 1, 2, 3, cerradas.length],
    alertas: [1, 3, 2, 4, 3, alertas.length],
    transito: [0, 1, 2, 1, 2, enTransito.length],
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["ID", "SKU", "Producto", "Cantidad", "Origen", "Destino", "Estado", "Fecha"];
    const rows = transferenciasFiltradas.map(t => {
      const prod = CATALOGOS.find(c => c.sku === t.sku);
      const bodOri = bodegas.find(b => b.id === t.origen);
      const bodDes = bodegas.find(b => b.id === t.destino);
      return [t.id, t.sku, prod?.nombre, t.cantidadDespacho ?? t.cantidad, bodOri?.nombre, bodDes?.nombre, t.estado, t.fechaCreacion];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transferencias_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const kpis = [
    { label: "Transferencias Activas", val: activas.length, color: "#3b82f6", filterKey: "TODOS", spark: sparkData.activas, icon: "📊" },
    { label: "Cerradas Totales", val: cerradas.length, color: "#22c55e", filterKey: "CERRADO", spark: sparkData.cerradas, icon: "✅" },
    { label: "Alertas de Stock", val: alertas.length, color: "#ef4444", filterKey: "TODOS", spark: sparkData.alertas, icon: "⚠️" },
    { label: "En Tránsito", val: enTransito.length, color: "#f97316", filterKey: "EN_TRANSITO", spark: sparkData.transito, icon: "🚚" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>

      {/* ═══ KPI CARDS ═══ */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {kpis.map((m, i) => (
          <div key={i}
            onClick={() => { setFiltroEstado(m.filterKey); setPagina(1); }}
            style={{
              background: "var(--bg-tertiary)",
              border: `1px solid ${filtroEstado === m.filterKey ? m.color + "60" : "var(--border-strong)"}`,
              borderRadius: "var(--radius-lg)", padding: "18px 20px",
              cursor: "pointer", transition: "all var(--transition-normal)",
              position: "relative", overflow: "hidden",
              animation: `fadeInUp 0.5s var(--ease-out-expo) ${i * 0.08}s both`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}15`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Top accent line */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, ${m.color}, transparent)`,
              opacity: filtroEstado === m.filterKey ? 1 : 0,
              transition: "opacity var(--transition-fast)"
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{
                  fontSize: 32, fontWeight: 800, color: m.color,
                  fontFamily: "var(--font-mono)", lineHeight: 1
                }}>
                  <AnimatedCount value={m.val} />
                </div>
                <div style={{
                  fontSize: 11, color: "var(--text-muted)", marginTop: 6,
                  textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600
                }}>
                  {m.label}
                </div>
              </div>
              <SparkLine data={m.spark} color={m.color} width={72} height={28} />
            </div>
          </div>
        ))}
      </div>

      {/* ═══ ALERTAS DE STOCK MÍNIMO ═══ */}
      {alertas.length > 0 && (
        <div style={{
          background: "rgba(239, 68, 68, 0.05)",
          border: "1px solid rgba(239, 68, 68, 0.15)",
          borderLeft: "3px solid #ef4444",
          borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: 20,
          animation: "fadeInUp 0.5s var(--ease-out-expo) 0.3s both"
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#ef4444",
            letterSpacing: 1, marginBottom: 10, textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-mono)"
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
              animation: "pulseDot 1.5s ease-in-out infinite"
            }} />
            Alertas de Stock Mínimo en Bodega
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {alertas.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, fontSize: 12, color: "#fca5a5", padding: "6px 10px",
                background: "rgba(239, 68, 68, 0.04)", borderRadius: 8
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <span style={{
                    fontSize: 10, color: a.bodegaColor, fontWeight: 700,
                    background: `${a.bodegaColor}15`, border: `1px solid ${a.bodegaColor}30`,
                    padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap"
                  }}>
                    {a.bodega}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{a.prod}</span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 10 }}>({a.sku})</span>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, flexShrink: 0
                }}>
                  <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "#ef4444" }}>{a.disp}</span>
                  <span style={{ color: "var(--text-faint)", fontSize: 10 }}>/ {a.min} mín.</span>
                  {/* Mini progress */}
                  <div style={{
                    width: 50, height: 4, borderRadius: 2,
                    background: "rgba(255,255,255,0.06)", overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${Math.min(100, a.pct)}%`, height: "100%", borderRadius: 2,
                      background: a.pct < 30 ? "#ef4444" : a.pct < 60 ? "#f59e0b" : "#22c55e",
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ BARRA DE HERRAMIENTAS ═══ */}
      <div style={{
        background: "var(--bg-tertiary)", border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-lg)", padding: "14px 18px", marginBottom: 16,
        display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end",
        animation: "fadeInUp 0.5s var(--ease-out-expo) 0.35s both"
      }}>
        {/* Buscador */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 180 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Buscar ID o SKU
          </span>
          <input
            type="text" value={busquedaSku}
            onChange={e => { setBusquedaSku(e.target.value); setPagina(1); }}
            placeholder="Ej: ST-2026 o SKU-1001"
            className="input-base"
            style={{ padding: "8px 12px", fontSize: 12 }}
            aria-label="Buscar transferencia por ID o SKU"
          />
        </div>

        {/* Filtro de estado */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, width: 220 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Filtrar por Fase
          </span>
          <select
            value={filtroEstado}
            onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }}
            className="input-base"
            style={{ padding: "8px 12px", fontSize: 12 }}
            aria-label="Filtrar transferencias por estado"
          >
            <option value="TODOS">— TODOS LOS ESTADOS —</option>
            <option value="ACCIONABLE">⚡ REQUERIDO PARA TU ROL</option>
            <option value="SOLICITADO">Solicitado (Por Aprobar)</option>
            <option value="PREPARANDO">Preparando (En Conteo)</option>
            <option value="DISCREPANCIA_PICKING">Discrepancia Picking</option>
            <option value="PREPARADO">Preparado (Por Retirar)</option>
            <option value="EN_TRANSITO">En Tránsito (En Ruta)</option>
            <option value="PENDIENTE_RECLAMO">Pendiente Reclamo</option>
            <option value="INCIDENCIAS">⚠ Todas las Alertas</option>
            <option value="CERRADO">Cerrado (Conforme)</option>
            <option value="CERRADO_CON_INCIDENCIA">Cerrado con Incidencia</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>

        {/* Exportar */}
        <Btn onClick={exportCSV} variant="ghost" small icon="📥">Exportar CSV</Btn>
      </div>

      {/* ═══ HEADER DE TABLA ═══ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14, animation: "fadeInUp 0.5s var(--ease-out-expo) 0.4s both"
      }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
          letterSpacing: 0.5, fontFamily: "var(--font-mono)"
        }}>
          Órdenes ({transferenciasFiltradas.length})
          {totalPaginas > 1 && <span style={{ color: "var(--text-faint)", marginLeft: 8 }}>Pág. {paginaActual}/{totalPaginas}</span>}
        </span>
        {(usuario.rol === "SOLICITANTE" || usuario.rol === "ADMIN") && (
          <Btn onClick={onNueva} small icon="＋">Nueva Solicitud</Btn>
        )}
      </div>

      {/* ═══ TABLA PRINCIPAL ═══ */}
      <div className="card" style={{ animation: "fadeInUp 0.5s var(--ease-out-expo) 0.45s both" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {["ID", "SKU / Producto", "Cant.", "Ruta", "Estado", "Fecha", ""].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itemsPagina.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon="🔍"
                      title="Sin resultados"
                      description="No se encontraron transferencias con los criterios actuales."
                    />
                  </td>
                </tr>
              )}
              {itemsPagina.map((t, idx) => {
                const prod = CATALOGOS.find(c => c.sku === t.sku);
                const bodOri = bodegas.find(b => b.id === t.origen);
                const bodDes = bodegas.find(b => b.id === t.destino);

                const requiereAtencionUsuario =
                  (t.estado === "SOLICITADO" && usuario.rol === "SUPERVISOR") ||
                  (t.estado === "PREPARANDO" && usuario.rol === "ENCARGADO_ORIGEN") ||
                  (t.estado === "DISCREPANCIA_PICKING" && usuario.rol === "SOLICITANTE") ||
                  (t.estado === "PREPARADO" && usuario.rol === "OPERADOR") ||
                  (t.estado === "EN_TRANSITO" && usuario.rol === "ENCARGADO_DESTINO") ||
                  (t.estado === "PENDIENTE_RECLAMO" && usuario.rol === "SUPERVISOR");

                return (
                  <tr key={t.id} style={{
                    background: requiereAtencionUsuario ? "rgba(99, 102, 241, 0.04)" : "transparent",
                    animation: `fadeIn 0.3s ease ${idx * 0.03}s both`
                  }}>
                    <td>
                      <div style={{
                        fontSize: 13, color: "var(--accent-blue)",
                        fontFamily: "var(--font-mono)", fontWeight: 700
                      }}>
                        {t.id}
                      </div>
                      {requiereAtencionUsuario && (
                        <div style={{
                          fontSize: 9, background: "rgba(99, 102, 241, 0.12)",
                          color: "var(--accent-indigo)",
                          border: "1px solid rgba(99, 102, 241, 0.25)",
                          padding: "2px 6px", borderRadius: 4, width: "fit-content",
                          marginTop: 4, fontWeight: 700, fontFamily: "var(--font-mono)",
                          animation: "pulseGlow 2s ease-in-out infinite"
                        }}>
                          ⚡ ACCIONAR
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                        {prod?.nombre}
                      </div>
                      <div style={{
                        fontSize: 10, color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)", marginTop: 2
                      }}>
                        {t.sku}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
                        fontFamily: "var(--font-mono)"
                      }}>
                        {t.cantidadDespacho ?? t.cantidad}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          background: `${bodOri?.color || "#3b82f6"}15`,
                          color: bodOri?.color || "#3b82f6",
                          padding: "2px 6px", borderRadius: 4, fontSize: 10,
                          fontWeight: 600, whiteSpace: "nowrap"
                        }}>
                          {bodOri?.nombre || t.origen}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                        <span style={{
                          background: `${bodDes?.color || "#22c55e"}15`,
                          color: bodDes?.color || "#22c55e",
                          padding: "2px 6px", borderRadius: 4, fontSize: 10,
                          fontWeight: 600, whiteSpace: "nowrap"
                        }}>
                          {bodDes?.nombre || t.destino}
                        </span>
                      </div>
                    </td>
                    <td><Badge estado={t.estado} /></td>
                    <td>
                      <span style={{
                        fontSize: 11, color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)"
                      }}>
                        {t.fechaCreacion}
                      </span>
                    </td>
                    <td>
                      <Btn small variant="ghost" onClick={() => onVerDetalle(t)} icon="→">
                        Ver
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: 6, padding: "14px 16px", borderTop: "1px solid var(--border-strong)"
          }}>
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={paginaActual <= 1}
              style={{
                background: "var(--bg-input)", border: "1px solid var(--border-strong)",
                color: "var(--text-secondary)", borderRadius: 6,
                padding: "5px 10px", fontSize: 11, cursor: paginaActual <= 1 ? "not-allowed" : "pointer",
                opacity: paginaActual <= 1 ? 0.4 : 1, fontFamily: "var(--font-sans)"
              }}
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPagina(p)} style={{
                background: p === paginaActual ? "var(--gradient-primary)" : "var(--bg-input)",
                border: p === paginaActual ? "none" : "1px solid var(--border-strong)",
                color: p === paginaActual ? "#fff" : "var(--text-muted)",
                borderRadius: 6, width: 30, height: 30, fontSize: 11,
                fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-mono)"
              }}>
                {p}
              </button>
            ))}
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              style={{
                background: "var(--bg-input)", border: "1px solid var(--border-strong)",
                color: "var(--text-secondary)", borderRadius: 6,
                padding: "5px 10px", fontSize: 11, cursor: paginaActual >= totalPaginas ? "not-allowed" : "pointer",
                opacity: paginaActual >= totalPaginas ? 0.4 : 1, fontFamily: "var(--font-sans)"
              }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}