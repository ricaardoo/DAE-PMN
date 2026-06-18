import { useState } from "react";
import { CATALOGOS } from "../data/mockData";
import { db } from "../data/db";
import { Btn } from "./Common";

export default function Inventario({ stock, bodegas, usuario }) {
  const [bodSel, setBodSel] = useState(() => (usuario?.rol !== "ADMIN" && usuario?.bodega) ? usuario.bodega : bodegas[0].id);
  const s = stock[bodSel] || {};
  const bod = bodegas.find(b => b.id === bodSel);

  const handleAvisarGestor = async (sku, skuNombre, disp, min) => {
    try {
      const existente = await db.alertas
        .where("bodegaId").equals(bodSel)
        .and(x => x.sku === sku)
        .first();

      if (existente) {
        alert("Ya existe una alerta de reposición activa para este producto en esta bodega.");
        return;
      }

      await db.alertas.add({
        bodegaId: bodSel,
        sku,
        skuNombre,
        cantActual: disp,
        cantMin: min,
        fecha: new Date().toISOString()
      });
      alert(`✓ Alerta enviada con éxito al Gestor de la bodega ${bod?.nombre}.`);
    } catch (e) {
      console.error("Error al crear alerta:", e);
      alert("Ocurrió un error al enviar la alerta.");
    }
  };

  const esSupervisor = usuario?.rol === "SUPERVISOR";

  return (
    <div>
      {/* Selector de Bodega visible solo para Administrador */}
      {usuario?.rol === "ADMIN" && (
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
      )}

      <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #2d3550", marginBottom: 12, padding: "14px 18px", fontSize: 12, color: "#9ca3af" }}>
        Bodega Seleccionada: <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{bod?.nombre}</span> | Encargado: <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{bod?.encargado}</span>
      </div>

      <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #2d3550", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2d3550" }}>
              {["SKU", "Producto", "Disponible", "Comprometido", "En Reclamo", "Mínimo", "Estado", ...(esSupervisor ? ["Acciones"] : [])].map(h => (
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
                  {esSupervisor && (
                    <td style={{ padding: "8px 14px" }}>
                      {bajo ? (
                        <Btn variant="warning" small onClick={() => handleAvisarGestor(sku, prod?.nombre, st.disp, st.min)}>
                          🔔 Avisar Gestor
                        </Btn>
                      ) : (
                        <span style={{ color: "#6b7280", fontSize: 12 }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
