import { useState } from "react";
import { CATALOGOS } from "../data/mockData";

export default function Inventario({ stock, bodegas }) {
  const [bodSel, setBodSel] = useState(bodegas[0].id);
  const s = stock[bodSel] || {};
  const bod = bodegas.find(b => b.id === bodSel);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {bodegas.map(b => (
          <button key={b.id} onClick={() => setBodSel(b.id)} style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Mono', monospace",
            background: bodSel === b.id ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "#1a1f2e",
            border: bodSel === b.id ? "none" : "1px solid #2d3550",
            color: bodSel === b.id ? "#fff" : "#9ca3af",
          }}>
            {b.nombre}
          </button>
        ))}
      </div>

      <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #2d3550", marginBottom: 12, padding: "14px 18px", fontSize: 12, color: "#9ca3af" }}>
        Encargado: <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{bod?.encargado}</span>
      </div>

      <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #2d3550", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2d3550" }}>
              {["SKU", "Producto", "Disponible", "Comprometido", "En Reclamo", "Mínimo", "Estado"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(s).map(([sku, st]) => {
              const prod = CATALOGOS.find(c => c.sku === sku);
              const bajo = st.disp < st.min;
              return (
                <tr key={sku} style={{ borderBottom: "1px solid #1e2535" }}>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{sku}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#e2e8f0" }}>{prod?.nombre}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: bajo ? "#ef4444" : "#22c55e" }}>{st.disp}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: st.comp > 0 ? "#f59e0b" : "#6b7280" }}>{st.comp}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: st.recl > 0 ? "#ef4444" : "#6b7280" }}>{st.recl}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b7280" }}>{st.min}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {bajo
                      ? <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>⚠ Bajo mínimo</span>
                      : <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>✓ OK</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
