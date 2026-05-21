import { CATALOGOS } from "../data/mockData";
import { Btn, Badge } from "./Common";

export default function Dashboard({ transferencias, stock, bodegas, onNueva, onVerDetalle, usuario }) {
  const activas = transferencias.filter(t => !["CERRADO", "CERRADO_CON_INCIDENCIA", "ANULADO"].includes(t.estado));
  const cerradas = transferencias.filter(t => t.estado === "CERRADO" || t.estado === "CERRADO_CON_INCIDENCIA");

  // alertas de stock bajo
  const alertas = [];
  bodegas.forEach(b => {
    Object.entries(stock[b.id] || {}).forEach(([sku, s]) => {
      if (s.disp < s.min) {
        const prod = CATALOGOS.find(c => c.sku === sku);
        alertas.push({ bodega: b.nombre, sku, prod: prod?.nombre, disp: s.disp, min: s.min });
      }
    });
  });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Transferencias Activas", val: activas.length, color: "#3b82f6" },
          { label: "Cerradas Hoy", val: cerradas.length, color: "#22c55e" },
          { label: "Alertas de Stock", val: alertas.length, color: "#ef4444" },
          { label: "En Tránsito", val: transferencias.filter(t => t.estado === "EN_TRANSITO").length, color: "#f97316" },
        ].map((m, i) => (
          <div key={i} style={{ background: "#1a1f2e", border: `1px solid ${m.color}33`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color, fontFamily: "'DM Mono', monospace" }}>{m.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {alertas.length > 0 && (
        <div style={{ background: "#ef444410", border: "1px solid #ef444433", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>⚠ Alertas de Stock Mínimo</div>
          {alertas.map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: "#fca5a5", marginBottom: 4 }}>
              {a.bodega} — {a.prod} ({a.sku}): {a.disp} uds. (mín. {a.min})
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" }}>Transferencias Recientes</span>
        {(usuario.rol === "SOLICITANTE" || usuario.rol === "ADMIN") && (
          <Btn onClick={onNueva} small>+ Nueva Solicitud</Btn>
        )}
      </div>

      <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #2d3550", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2d3550" }}>
              {["ID", "SKU / Producto", "Cant.", "Origen → Destino", "Estado", "Fecha", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transferencias.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#4b5563", fontSize: 13 }}>Sin transferencias registradas</td></tr>
            )}
            {[...transferencias].reverse().map(t => {
              const prod = CATALOGOS.find(c => c.sku === t.sku);
              const bodOri = bodegas.find(b => b.id === t.origen);
              const bodDes = bodegas.find(b => b.id === t.destino);
              return (
                <tr key={t.id} style={{ borderBottom: "1px solid #1e2535", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#ffffff08"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{t.id}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#e2e8f0" }}><span style={{ color: "#6b7280", fontSize: 10 }}>{t.sku}</span><br/>{prod?.nombre}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>{t.cantidad}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#9ca3af" }}>{bodOri?.nombre} → {bodDes?.nombre}</td>
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
