import { useState, useEffect } from "react";
import { USUARIOS } from "../data/mockData";

export default function Landing({ setUsuario }) {
  const [loaded, setLoaded] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [stats, setStats] = useState({ bodegas: 0, skus: 0, roles: 0 });

  useEffect(() => {
    setLoaded(true);
    // Animated stats counter
    const targets = { bodegas: 3, skus: 5, roles: 7 };
    const duration = 1200;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setStats({
        bodegas: Math.round(targets.bodegas * eased),
        skus: Math.round(targets.skus * eased),
        roles: Math.round(targets.roles * eased),
      });
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  const obtenerRolLabelAmigable = (rol) => {
    switch (rol) {
      case "SOLICITANTE": return "Encargado de Tienda / Destino";
      case "SUPERVISOR": return "Jefa de Logística / Supervisor";
      case "ENCARGADO_ORIGEN": return "Operador de Almacén (Origen)";
      case "OPERADOR": return "Transportista (Custodia en Ruta)";
      case "ENCARGADO_DESTINO": return "Recepción de Almacén Destino";
      case "ADMIN": return "Administrador Central del SCI";
      default: return rol;
    }
  };

  const rolColors = {
    SOLICITANTE: "#3b82f6",
    SUPERVISOR: "#8b5cf6",
    ENCARGADO_ORIGEN: "#22c55e",
    OPERADOR: "#f59e0b",
    ENCARGADO_DESTINO: "#06b6d4",
    ADMIN: "#ef4444",
  };

  const listaUsuarios = USUARIOS || [];

  const features = [
    { title: "Automatización y Mínimos", desc: "Alertas en tiempo real cuando el disponible de un SKU cae por debajo del umbral mínimo de seguridad operacional.", icon: "📦", color: "#ef4444" },
    { title: "Trazabilidad de Transporte", desc: "Control estricto con firma digital en la entrega del operador y validaciones cruzadas origen-destino en cada etapa.", icon: "🛡️", color: "#06b6d4" },
    { title: "Aprobación Inteligente", desc: "Pedidos automáticos directos e intercepción por Supervisor para flujos de alto volumen, costo o impacto en stock.", icon: "⚡", color: "#f59e0b" },
  ];

  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${60 + Math.random() * 40}%`,
    type: i % 3 === 0 ? "particle-1" : i % 3 === 1 ? "particle-2" : "particle-3",
    delay: `${Math.random() * 8}s`,
    size: 2 + Math.random() * 4,
  }));

  return (
    <div className="mesh-grid" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      color: "var(--text-primary)", padding: "0 20px",
      position: "relative", overflow: "hidden"
    }}>
      {/* Floating Particles */}
      {particles.map(p => (
        <div key={p.id} className={p.type} style={{
          left: p.left, bottom: p.top, animationDelay: p.delay,
          width: p.size, height: p.size,
        }} />
      ))}

      {/* Ambient glow orbs */}
      <div style={{
        position: "absolute", top: "10%", left: "5%", width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
        animation: "float 8s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", bottom: "5%", right: "10%", width: 350, height: 350,
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
        animation: "float 10s ease-in-out infinite reverse"
      }} />

      {/* ═══ HEADER ═══ */}
      <header style={{
        maxWidth: 1200, width: "100%", margin: "0 auto",
        padding: "24px 0", display: "flex", justifyContent: "space-between",
        alignItems: "center", position: "relative", zIndex: 2,
        opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(-10px)",
        transition: "all 0.6s var(--ease-out-expo)"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "var(--gradient-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-glow-indigo)"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <span style={{
            fontSize: 18, fontWeight: 800, color: "var(--text-primary)",
            fontFamily: "var(--font-sans)", letterSpacing: -0.3
          }}>
            ControlBod<span style={{ color: "var(--accent-indigo)" }}>.</span>
          </span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 16
        }}>
          <span style={{
            fontSize: 10, color: "var(--text-faint)", letterSpacing: 1.5,
            textTransform: "uppercase", fontFamily: "var(--font-mono)",
            background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.15)",
            padding: "4px 12px", borderRadius: 20
          }}>
            v2.0 Final
          </span>
        </div>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <main style={{
        maxWidth: 1200, width: "100%", margin: "auto",
        position: "relative", zIndex: 2, padding: "20px 0 60px"
      }}>
        <div className="landing-grid" style={{
          opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s var(--ease-out-expo) 0.1s"
        }}>
          {/* Left Column: Hero Content */}
          <div>
            {/* Tag */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 24, padding: "6px 16px 6px 10px", marginBottom: 28
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--accent-green)",
                boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)",
                animation: "pulseDot 2s ease-in-out infinite"
              }} />
              <span style={{
                fontSize: 11, fontWeight: 600, color: "var(--accent-indigo)",
                letterSpacing: 0.5, fontFamily: "var(--font-sans)"
              }}>
                Sistema Logístico MPN — En Línea
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800,
              color: "var(--text-primary)", lineHeight: 1.1,
              margin: "0 0 20px", letterSpacing: "-0.03em",
              fontFamily: "var(--font-sans)"
            }}>
              Control y Tránsito de{" "}
              <span style={{
                background: "var(--gradient-hero)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "gradientShift 4s ease infinite"
              }}>
                Stock Inter-Bodegas
              </span>
            </h1>

            {/* Description */}
            <p style={{
              fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7,
              marginBottom: 36, maxWidth: 520, fontFamily: "var(--font-sans)"
            }}>
              Plataforma empresarial interactiva para gestionar almacenes, validar picking físico,
              firmar custodias de transporte y mitigar incidencias de recepción con auditoría
              completa por roles.
            </p>

            {/* Stats Row */}
            <div style={{
              display: "flex", gap: 32, marginBottom: 40
            }}>
              {[
                { label: "Bodegas", value: stats.bodegas, suffix: "" },
                { label: "Productos", value: stats.skus, suffix: " SKU" },
                { label: "Roles", value: stats.roles, suffix: "" },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 28, fontWeight: 800, color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)", lineHeight: 1
                  }}>
                    {stat.value}{stat.suffix}
                  </div>
                  <div style={{
                    fontSize: 10, color: "var(--text-muted)", marginTop: 4,
                    textTransform: "uppercase", letterSpacing: 1, fontWeight: 600
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { icon: "📦", text: "3 Bodegas conectadas" },
                { icon: "🛡️", text: "Flujo auditado" },
                { icon: "⚡", text: "Aprobaciones automáticas" },
                { icon: "👥", text: "Control por roles" }
              ].map((pill, idx) => (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10, padding: "8px 14px",
                  transition: "all var(--transition-fast)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                  e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                }}>
                  <span style={{ fontSize: 16 }}>{pill.icon}</span>
                  <span style={{
                    fontSize: 12, color: "var(--text-secondary)", fontWeight: 500
                  }}>
                    {pill.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Login Panel */}
          <div style={{
            background: "linear-gradient(180deg, rgba(17, 22, 37, 0.9) 0%, rgba(15, 19, 32, 0.95) 100%)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-xl)", padding: 0,
            boxShadow: "var(--shadow-xl), 0 0 0 1px rgba(99, 102, 241, 0.05)",
            overflow: "hidden"
          }}>
            {/* Panel Header */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid var(--border-default)",
              background: "rgba(99, 102, 241, 0.03)"
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 8
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "var(--accent-green)",
                  boxShadow: "0 0 8px rgba(34, 197, 94, 0.4)"
                }} />
                <span style={{
                  fontSize: 10, color: "var(--accent-indigo)", fontWeight: 700,
                  letterSpacing: 1.5, textTransform: "uppercase",
                  fontFamily: "var(--font-mono)"
                }}>
                  Acceso al Sistema
                </span>
              </div>
              <h2 style={{
                fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
                fontFamily: "var(--font-sans)", margin: "0 0 4px"
              }}>
                Selecciona tu Perfil
              </h2>
              <p style={{
                fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5,
                fontFamily: "var(--font-sans)", margin: 0
              }}>
                El sistema adaptará la interfaz según el rol seleccionado.
              </p>
            </div>

            {/* User List */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 2,
              maxHeight: 380, overflowY: "auto", padding: "8px"
            }}>
              {listaUsuarios.map(u => {
                const rolLabelCalculado = u.rolLabel || obtenerRolLabelAmigable(u.rol);
                const dotColor = rolColors[u.rol] || "#10b981";
                const isHovered = hoveredId === u.id;

                return (
                  <button
                    key={u.id}
                    onClick={() => setUsuario({ ...u, rolLabel: rolLabelCalculado })}
                    onMouseEnter={() => setHoveredId(u.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      width: "100%", padding: "12px 16px",
                      background: isHovered ? "rgba(99, 102, 241, 0.06)" : "transparent",
                      border: "1px solid transparent",
                      borderColor: isHovered ? "rgba(99, 102, 241, 0.15)" : "transparent",
                      borderRadius: 12, color: "var(--text-primary)",
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.2s var(--ease-out-expo)",
                      fontFamily: "var(--font-sans)", outline: "none",
                      transform: isHovered ? "translateX(4px)" : "translateX(0)",
                    }}
                    aria-label={`Iniciar sesión como ${u.nombre}`}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: `${dotColor}12`,
                      border: `1px solid ${dotColor}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: dotColor, fontSize: 12, fontWeight: 700, flexShrink: 0,
                      fontFamily: "var(--font-sans)",
                      transition: "all var(--transition-fast)",
                      boxShadow: isHovered ? `0 0 12px ${dotColor}20` : "none"
                    }}>
                      {u.nombre.split(" ").map(w => w[0]).join("")}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {u.nombre}
                      </div>
                      <div style={{
                        fontSize: 11, color: "var(--text-muted)", marginTop: 2,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {rolLabelCalculado}
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke={isHovered ? dotColor : "var(--text-faint)"}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition: "all var(--transition-fast)", flexShrink: 0, opacity: isHovered ? 1 : 0.4 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ FEATURES SECTION ═══ */}
        <div className="features-grid" style={{
          maxWidth: 1200, width: "100%", margin: "60px auto 0",
          opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s var(--ease-out-expo) 0.3s"
        }}>
          {features.map((feat, idx) => (
            <div key={idx} style={{
              background: "rgba(17, 22, 37, 0.6)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              padding: "24px", position: "relative", overflow: "hidden",
              transition: "all 0.3s var(--ease-out-expo)",
              cursor: "default"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.borderColor = `${feat.color}50`;
              e.currentTarget.style.boxShadow = `0 8px 32px ${feat.color}10`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              {/* Accent line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${feat.color}, transparent)`
              }} />
              <div style={{
                fontSize: 28, marginBottom: 14, width: 44, height: 44,
                borderRadius: 12, background: `${feat.color}10`,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {feat.icon}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
                marginBottom: 8, fontFamily: "var(--font-sans)"
              }}>
                {feat.title}
              </div>
              <div style={{
                fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
                fontFamily: "var(--font-sans)"
              }}>
                {feat.desc}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        maxWidth: 1200, width: "100%", margin: "0 auto",
        borderTop: "1px solid var(--border-default)",
        padding: "20px 0 24px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: "var(--text-faint)", flexWrap: "wrap", gap: 12,
        position: "relative", zIndex: 2
      }}>
        <div style={{ fontFamily: "var(--font-sans)" }}>
          © 2026 ControlBod SCI — Sistema de Control de Inventario Inter-Bodegas
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <span style={{ cursor: "default" }}>Documentación</span>
          <span style={{ cursor: "default" }}>Seguridad</span>
          <span style={{ cursor: "default" }}>v2.0 Final</span>
        </div>
      </footer>
    </div>
  );
}