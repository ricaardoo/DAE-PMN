import { useState, useMemo } from "react";
import { CATALOGOS } from "../data/mockData";
import { ProgressBar, DonutChart } from "./Common";

export default function Inventario({ stock, bodegas }) {
  const [bodSel, setBodSel] = useState(bodegas[0].id);
  const s = stock[bodSel] || {};
  const bod = bodegas.find(b => b.id === bodSel);

  // Resumen general de la bodega
  const resumen = useMemo(() => {
    const entries = Object.entries(s);
    const totalDisp = entries.reduce((sum, [, st]) => sum + st.disp, 0);
    const totalComp = entries.reduce((sum, [, st]) => sum + st.comp, 0);
    const totalRecl = entries.reduce((sum, [, st]) => sum + st.recl, 0);
    const totalMin = entries.reduce((sum, [, st]) => sum + st.min, 0);
    const alertas = entries.filter(([, st]) => st.disp < st.min).length;
    const total = totalDisp + totalComp + totalRecl;
    return { totalDisp, totalComp, totalRecl, totalMin, alertas, total, items: entries.length };
  }, [s]);

  // Valor total del inventario
  const valorTotal = useMemo(() => {
    return Object.entries(s).reduce((sum, [sku, st]) => {
      const prod = CATALOGOS.find(c => c.sku === sku);
      return sum + (st.disp + st.comp) * (prod?.precio || 0);
    }, 0);
  }, [s]);

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* ═══ SELECTOR DE BODEGA ═══ */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap"
      }}>
        {bodegas.map(b => {
          const isActive = bodSel === b.id;
          const bodegaStock = stock[b.id] || {};
          const alertCount = Object.values(bodegaStock).filter(st => st.disp < st.min).length;

          return (
            <button key={b.id} onClick={() => setBodSel(b.id)} style={{
              padding: "12px 20px", borderRadius: "var(--radius-md)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all var(--transition-fast)",
              fontFamily: "var(--font-sans)", border: "none",
              background: isActive ? `linear-gradient(135deg, ${b.color}, ${b.color}cc)` : "var(--bg-tertiary)",
              color: isActive ? "#fff" : "var(--text-secondary)",
              boxShadow: isActive ? `0 4px 16px ${b.color}30` : "none",
              position: "relative", display: "flex", alignItems: "center", gap: 10,
              outline: isActive ? `2px solid ${b.color}40` : "1px solid var(--border-strong)",
              outlineOffset: isActive ? 2 : 0
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
            }}>
              <span>{b.nombre}</span>
              {alertCount > 0 && (
                <span style={{
                  background: "#ef4444", color: "#fff", borderRadius: 10,
                  padding: "1px 6px", fontSize: 9, fontWeight: 700,
                  animation: "pulseDot 2s ease-in-out infinite"
                }}>
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ RESUMEN DE BODEGA ═══ */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 14, marginBottom: 24
      }}>
        {[
          { label: "Disponible", value: resumen.totalDisp, color: "#22c55e", icon: "📦" },
          { label: "Comprometido", value: resumen.totalComp, color: "#f59e0b", icon: "🔒" },
          { label: "En Reclamo", value: resumen.totalRecl, color: "#ef4444", icon: "⚠️" },
          { label: "Valor Inventario", value: `$${valorTotal.toLocaleString("es-CL")}`, color: "#8b5cf6", icon: "💰" },
          { label: "SKUs Activos", value: resumen.items, color: "#06b6d4", icon: "📋" },
          { label: "Alertas", value: resumen.alertas, color: resumen.alertas > 0 ? "#ef4444" : "#22c55e", icon: resumen.alertas > 0 ? "🔴" : "✅" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "var(--bg-tertiary)", border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-md)", padding: "14px 16px",
            animation: `fadeInUp 0.4s var(--ease-out-expo) ${i * 0.05}s both`
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div>
                <div style={{
                  fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase",
                  letterSpacing: 0.5, fontWeight: 600, marginBottom: 4
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: stat.color,
                  fontFamily: "var(--font-mono)"
                }}>
                  {stat.value}
                </div>
              </div>
              <span style={{ fontSize: 20, opacity: 0.6 }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ INFO DE ENCARGADO ═══ */}
      <div style={{
        background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-strong)", marginBottom: 16,
        padding: "12px 18px", display: "flex", justifyContent: "space-between",
        alignItems: "center", animation: "fadeIn 0.4s ease"
      }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Encargado: <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{bod?.encargado}</span>
        </div>
        <div style={{
          fontSize: 10, color: bod?.color, fontWeight: 600,
          background: `${bod?.color}12`, border: `1px solid ${bod?.color}25`,
          padding: "3px 10px", borderRadius: 6
        }}>
          {bod?.region}
        </div>
      </div>

      {/* ═══ TABLA DE INVENTARIO ═══ */}
      <div className="card" style={{ animation: "fadeInUp 0.5s var(--ease-out-expo) 0.2s both" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {["SKU", "Producto", "Disponible", "Comprometido", "Reclamo", "Mínimo", "Nivel", "Estado"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(s).map(([sku, st], idx) => {
                const prod = CATALOGOS.find(c => c.sku === sku);
                const bajo = st.disp < st.min;
                const pct = st.min > 0 ? Math.round((st.disp / st.min) * 100) : 100;
                const total = st.disp + st.comp + st.recl;

                return (
                  <tr key={sku} style={{
                    background: bajo ? "rgba(239, 68, 68, 0.03)" : "transparent",
                    animation: `fadeIn 0.3s ease ${idx * 0.04}s both`
                  }}>
                    <td>
                      <span style={{
                        fontSize: 12, color: "var(--accent-blue)",
                        fontFamily: "var(--font-mono)", fontWeight: 700
                      }}>
                        {sku}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                        {prod?.nombre}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 1 }}>
                        ${prod?.precio?.toLocaleString("es-CL")} /ud
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 15, fontWeight: 800, fontFamily: "var(--font-mono)",
                        color: bajo ? "#ef4444" : "#22c55e"
                      }}>
                        {st.disp}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 600,
                        color: st.comp > 0 ? "#f59e0b" : "var(--text-faint)"
                      }}>
                        {st.comp}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 600,
                        color: st.recl > 0 ? "#ef4444" : "var(--text-faint)"
                      }}>
                        {st.recl}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 12, fontFamily: "var(--font-mono)",
                        color: "var(--text-muted)"
                      }}>
                        {st.min}
                      </span>
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <ProgressBar
                            value={st.disp}
                            max={Math.max(st.min * 1.5, total, 1)}
                            color={bajo ? "#ef4444" : "#22c55e"}
                            height={5}
                          />
                        </div>
                        <DonutChart
                          value={st.disp}
                          max={Math.max(st.min, 1)}
                          color={bajo ? "#ef4444" : pct < 120 ? "#f59e0b" : "#22c55e"}
                          size={32}
                          thickness={3}
                        />
                      </div>
                    </td>
                    <td>
                      {bajo ? (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: 10, color: "#ef4444", fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: 0.5,
                          animation: bajo ? "borderPulse 1.5s ease infinite" : "none",
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: 6, padding: "3px 8px",
                          fontFamily: "var(--font-mono)"
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%", background: "#ef4444",
                            animation: "pulseDot 1.5s ease-in-out infinite"
                          }} />
                          Bajo mínimo
                        </div>
                      ) : (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: 10, color: "#22c55e", fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: 0.5,
                          background: "rgba(34, 197, 94, 0.08)",
                          border: "1px solid rgba(34, 197, 94, 0.2)",
                          borderRadius: 6, padding: "3px 8px",
                          fontFamily: "var(--font-mono)"
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%", background: "#22c55e"
                          }} />
                          OK
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ COMPARATIVA ENTRE BODEGAS ═══ */}
      <div style={{
        marginTop: 24, animation: "fadeInUp 0.5s var(--ease-out-expo) 0.4s both"
      }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
          letterSpacing: 0.5, marginBottom: 14, fontFamily: "var(--font-mono)"
        }}>
          COMPARATIVA DE STOCK ENTRE BODEGAS
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${bodegas.length}, 1fr)`,
          gap: 14
        }}>
          {bodegas.map(b => {
            const bodStock = stock[b.id] || {};
            const totalDisp = Object.values(bodStock).reduce((s, st) => s + st.disp, 0);
            const totalMin = Object.values(bodStock).reduce((s, st) => s + st.min, 0);
            const alertCount = Object.values(bodStock).filter(st => st.disp < st.min).length;
            const pct = totalMin > 0 ? Math.round((totalDisp / totalMin) * 100) : 100;
            const isSelected = b.id === bodSel;

            return (
              <div key={b.id} onClick={() => setBodSel(b.id)} style={{
                background: isSelected ? `${b.color}08` : "var(--bg-tertiary)",
                border: `1px solid ${isSelected ? b.color + "40" : "var(--border-strong)"}`,
                borderRadius: "var(--radius-md)", padding: "16px",
                cursor: "pointer", transition: "all var(--transition-fast)",
                textAlign: "center"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <DonutChart value={totalDisp} max={totalMin || 1} color={b.color} size={56} thickness={4} />
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4
                }}>
                  {b.nombre}
                </div>
                <div style={{
                  fontSize: 11, color: "var(--text-muted)", marginBottom: 8
                }}>
                  {totalDisp} uds disponibles
                </div>
                {alertCount > 0 && (
                  <div style={{
                    fontSize: 9, color: "#ef4444", fontWeight: 700,
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: 4, padding: "2px 6px", display: "inline-block"
                  }}>
                    {alertCount} alerta{alertCount > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
