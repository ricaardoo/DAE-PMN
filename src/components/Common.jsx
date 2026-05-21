import { ESTADO_COLOR, ESTADOS_LABEL } from "../data/mockData";

export function Badge({ estado }) {
  return (
    <span style={{
      background: ESTADO_COLOR[estado] + "22",
      color: ESTADO_COLOR[estado],
      border: `1px solid ${ESTADO_COLOR[estado]}55`,
      borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700,
      letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap"
    }}>
      {ESTADOS_LABEL[estado] || estado}
    </span>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#1a1f2e", border: "1px solid #2d3550", borderRadius: 16, padding: 28, maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#a0aec0", fontWeight: 700, letterSpacing: 1 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled = false, small = false }) {
  const styles = {
    primary: { background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", border: "none" },
    success: { background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", border: "none" },
    danger:  { background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none" },
    warning: { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: "#9ca3af", border: "1px solid #374151" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant],
      borderRadius: 8, padding: small ? "6px 14px" : "9px 18px",
      fontSize: small ? 12 : 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "all 0.15s", letterSpacing: 0.3,
      fontFamily: "'DM Mono', monospace"
    }}>
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, type = "text", options, placeholder }) {
  const base = {
    background: "#0f1520", border: "1px solid #2d3550", borderRadius: 8,
    color: "#e2e8f0", padding: "9px 12px", width: "100%", fontSize: 13,
    fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box"
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>}
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={base}>
          <option value="">Seleccionar...</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  );
}

export function Alert({ type, children }) {
  const colors = { info: "#3b82f6", warn: "#f59e0b", error: "#ef4444", success: "#22c55e" };
  const c = colors[type] || colors.info;
  return (
    <div style={{ background: c + "15", border: `1px solid ${c}44`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: c, marginBottom: 12 }}>
      {children}
    </div>
  );
}
