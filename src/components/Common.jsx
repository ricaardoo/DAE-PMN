import { useState, useEffect, useRef } from "react";
import { ESTADO_COLOR, ESTADOS_LABEL } from "../data/mockData";

/* ═══════════════════════════════════════════════════════════════════════════
   BADGE — Estado visual de transferencia
   ═══════════════════════════════════════════════════════════════════════════ */
export function Badge({ estado }) {
  const color = ESTADO_COLOR[estado] || "#6b7280";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: color + "18",
      color: color,
      border: `1px solid ${color}40`,
      borderRadius: 20, padding: "3px 12px 3px 8px", fontSize: 10, fontWeight: 700,
      letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap",
      fontFamily: "var(--font-mono)"
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: color,
        boxShadow: `0 0 6px ${color}60`,
        animation: ["EN_TRANSITO", "PREPARANDO", "PENDIENTE_RECLAMO"].includes(estado) ? "pulseDot 2s ease-in-out infinite" : "none"
      }} />
      {ESTADOS_LABEL[estado] || estado}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODAL — Contenedor premium con backdrop animado
   ═══════════════════════════════════════════════════════════════════════════ */
export function Modal({ title, onClose, children, width = 560 }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "modalBackdropIn 0.25s ease forwards"
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div style={{
        background: "linear-gradient(180deg, #141b2d 0%, #111827 100%)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-xl)", padding: 0,
        maxWidth: width, width: "100%", maxHeight: "88vh",
        overflowY: "auto", animation: "modalContentIn 0.3s var(--ease-out-expo) forwards",
        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)"
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: "1px solid var(--border-strong)",
          background: "rgba(99, 102, 241, 0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 3, height: 18, borderRadius: 2,
              background: "var(--gradient-primary)"
            }} />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 13,
              color: "var(--text-secondary)", fontWeight: 700, letterSpacing: 0.5
            }}>
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-default)",
              color: "var(--text-muted)", width: 30, height: 30, borderRadius: 8,
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", transition: "all var(--transition-fast)"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: "24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BTN — Botón premium con variantes
   ═══════════════════════════════════════════════════════════════════════════ */
export function Btn({ children, onClick, variant = "primary", disabled = false, small = false, icon }) {
  const styles = {
    primary: {
      background: "var(--gradient-primary)", color: "#fff", border: "none",
      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)"
    },
    success: {
      background: "var(--gradient-success)", color: "#fff", border: "none",
      boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)"
    },
    danger: {
      background: "var(--gradient-danger)", color: "#fff", border: "none",
      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)"
    },
    warning: {
      background: "var(--gradient-warning)", color: "#fff", border: "none",
      boxShadow: "0 2px 8px rgba(245, 158, 11, 0.25)"
    },
    ghost: {
      background: "transparent", color: "var(--text-secondary)",
      border: "1px solid var(--border-default)", boxShadow: "none"
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        display: "inline-flex", alignItems: "center", gap: 6,
        borderRadius: small ? "var(--radius-sm)" : "var(--radius-md)",
        padding: small ? "6px 14px" : "10px 20px",
        fontSize: small ? 11 : 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all var(--transition-fast)",
        fontFamily: "var(--font-sans)",
        letterSpacing: 0.2,
        position: "relative",
        overflow: "hidden",
        whiteSpace: "nowrap"
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.filter = "brightness(1.1)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.filter = "brightness(1)";
      }}
    >
      {icon && <span style={{ fontSize: small ? 12 : 14 }}>{icon}</span>}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INPUT — Campo de entrada premium
   ═══════════════════════════════════════════════════════════════════════════ */
export function Input({ label, value, onChange, type = "text", options, placeholder, helpText }) {
  const base = {
    background: "var(--bg-input)", border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-md)", color: "var(--text-primary)",
    padding: "10px 14px", width: "100%", fontSize: 13,
    fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
    transition: "all var(--transition-fast)"
  };

  const handleFocus = (e) => {
    e.currentTarget.style.borderColor = "var(--accent-indigo)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.12)";
  };
  const handleBlur = (e) => {
    e.currentTarget.style.borderColor = "var(--border-strong)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{
          color: "var(--text-secondary)", fontSize: 11, fontWeight: 600,
          letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase",
          fontFamily: "var(--font-sans)"
        }}>
          {label}
        </div>
      )}
      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={base}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label={label}
        >
          <option value="">Seleccionar...</option>
          {options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={base}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label={label}
        />
      )}
      {helpText && (
        <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4, fontFamily: "var(--font-sans)" }}>
          {helpText}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ALERT — Alerta informativa con íconos
   ═══════════════════════════════════════════════════════════════════════════ */
export function Alert({ type, children }) {
  const configs = {
    info:    { color: "#3b82f6", icon: "ℹ", bg: "#3b82f610" },
    warn:    { color: "#f59e0b", icon: "⚠", bg: "#f59e0b10" },
    error:   { color: "#ef4444", icon: "✕", bg: "#ef444410" },
    success: { color: "#22c55e", icon: "✓", bg: "#22c55e10" },
  };
  const c = configs[type] || configs.info;

  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.color}30`,
      borderLeft: `3px solid ${c.color}`,
      borderRadius: "var(--radius-md)", padding: "12px 16px",
      fontSize: 12, color: c.color, lineHeight: 1.6,
      display: "flex", gap: 10, alignItems: "flex-start",
      animation: "fadeIn 0.3s ease forwards"
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%",
        background: `${c.color}20`, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, flexShrink: 0
      }}>
        {c.icon}
      </span>
      <div style={{ flex: 1, fontFamily: "var(--font-sans)" }}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESS BAR — Barra de progreso visual
   ═══════════════════════════════════════════════════════════════════════════ */
export function ProgressBar({ value, max, color = "#3b82f6", height = 6, showLabel = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const danger = pct < 40;

  return (
    <div style={{ width: "100%" }}>
      <div className="progress-bar" style={{ height }}>
        <div className="progress-bar-fill" style={{
          width: `${pct}%`,
          background: danger
            ? "linear-gradient(90deg, #ef4444, #f97316)"
            : `linear-gradient(90deg, ${color}, ${color}cc)`
        }} />
      </div>
      {showLabel && (
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 4,
          fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)"
        }}>
          <span>{value}</span>
          <span style={{ color: danger ? "#ef4444" : "var(--text-muted)" }}>{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPARKLINE — Mini gráfico SVG
   ═══════════════════════════════════════════════════════════════════════════ */
export function SparkLine({ data, color = "#3b82f6", width = 80, height = 28 }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * w;
    const y = padding + h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Punto final */}
      <circle cx={width - padding} cy={padding + h - ((data[data.length - 1] - min) / range) * h} r="2.5" fill={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DONUT CHART — Gráfico circular SVG
   ═══════════════════════════════════════════════════════════════════════════ */
export function DonutChart({ value, max, color = "#3b82f6", size = 48, thickness = 5 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s var(--ease-out-expo)" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, color: color, fontFamily: "var(--font-mono)"
      }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED COUNT — Conteo animado
   ═══════════════════════════════════════════════════════════════════════════ */
export function AnimatedCount({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{display}</>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMPTY STATE — Estado vacío elegante
   ═══════════════════════════════════════════════════════════════════════════ */
export function EmptyState({ icon = "📋", title, description }) {
  return (
    <div style={{
      padding: "48px 24px", textAlign: "center",
      animation: "fadeIn 0.4s ease forwards"
    }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.6 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 300, margin: "0 auto", lineHeight: 1.5 }}>
          {description}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATUS DOT — Punto de estado animado
   ═══════════════════════════════════════════════════════════════════════════ */
export function StatusDot({ color, pulse = false, size = 8 }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 ${size}px ${color}60`,
      animation: pulse ? "pulseDot 2s ease-in-out infinite" : "none"
    }} />
  );
}
