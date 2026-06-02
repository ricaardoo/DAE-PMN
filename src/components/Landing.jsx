import { USUARIOS } from "../data/mockData";

export default function Landing({ setUsuario }) {
  
  // Mapeo seguro de etiquetas amigables según el rol de la base de datos
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

  // Respaldo por si la variable mockData viene vacía o mutada
  const listaUsuarios = USUARIOS || [];

  return (
    <div className="mesh-grid" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Mono', monospace", color: "#e2e8f0", padding: "40px 20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      
      {/* Header de la Landing */}
      <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#6366f1", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 10px #6366f1" }} />
          ControlBod.
        </div>
        <span style={{ fontSize: 10, color: "#4b5563", letterSpacing: 1, textTransform: "uppercase" }}>v1.2.0 Stable</span>
      </div>

      {/* Contenido Principal Grid */}
      <div className="animate-fade-in-up landing-grid" style={{ maxWidth: 1200, width: "100%", margin: "auto" }}>
        
        {/* Columna Izquierda: Mensaje Comercial / Operativo */}
        <div>
          <span style={{ background: "linear-gradient(135deg, #3b82f615, #6366f115)", border: "1px solid #6366f133", color: "#818cf8", borderRadius: 20, padding: "6px 16px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            Logística Inteligente MPN
          </span>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: "#f3f4f6", fontFamily: "'Outfit', sans-serif", lineHeight: 1.1, margin: "24px 0 16px", letterSpacing: "-0.02em" }}>
            Control y Tránsito de <span style={{ background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Stock Inter-Bodegas</span>
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.6, marginBottom: 32, fontFamily: "sans-serif" }}>
            Plataforma empresarial interactiva para gestionar almacenes, validar picking físico, firmar custodias de transporte y mitigar incidencias de recepción con auditoría completa por roles. Conectado a persistencia indexada local.
          </p>

          {/* Telemetría o Características Rápidas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[
              { title: "3 Bodegas", desc: "Norte, Centro y Sur conectadas en caliente", icon: "📦" },
              { title: "Flujo Auditado", desc: "Trazabilidad completa de eventos (Timeline)", icon: "🛡️" },
              { title: "Aprobaciones", desc: "Control automático de montos por Supervisor", icon: "⚡" },
              { title: "Rol-Based", desc: "Vistas y acciones restringidas por actor", icon: "👥" }
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20, background: "#1a1f2e", border: "1px solid #2d3550", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6" }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontFamily: "sans-serif" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Panel de Login Simulado */}
        <div className="glass-card" style={{ background: "#111625", border: "1px solid #1e293b", borderRadius: 20, padding: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Acceso de Evaluación Docente</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f3f4f6", fontFamily: "'Outfit', sans-serif", margin: 0 }}>Selecciona tu Perfil</h2>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontFamily: "sans-serif" }}>Al hacer clic, el sistema cambiará el entorno al rol seleccionado para probar la consistencia del flujo operacional.</p>
          </div>

          {/* Lista de Perfiles de Prueba con Scroll Interno */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
            {listaUsuarios.map(u => {
              const rolLabelCalculado = u.rolLabel || obtenerRolLabelAmigable(u.rol);
              
              let dotColor = "#10b981"; // Verde por defecto (Operadores/Solicitantes)
              if (u.rol === "SUPERVISOR") dotColor = "#8b5cf6"; // Púrpura
              if (u.rol === "OPERADOR") dotColor = "#f59e0b"; // Amarillo
              if (u.rol === "ADMIN") dotColor = "#ef4444"; // Rojo

              return (
                <button 
                  key={u.id} 
                  onClick={() => setUsuario({ ...u, rolLabel: rolLabelCalculado })} 
                  style={{
                    display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 16px",
                    background: "#0c101b", border: "1px solid #1e293b", borderRadius: 12,
                    color: "#e2e8f0", cursor: "pointer", textAlign: "left", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    fontFamily: "'DM Mono', monospace", outline: "none"
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.borderColor = "#3b82f677"; 
                    e.currentTarget.style.background = "#131b2e";
                    e.currentTarget.style.transform = "translateX(4px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.1)";
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.borderColor = "#1e293b"; 
                    e.currentTarget.style.background = "#0c101b";
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Iniciales del Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", background: dotColor + "15",
                    border: `1px solid ${dotColor}44`, display: "flex", alignItems: "center", justifyContent: "center",
                    color: dotColor, fontSize: 11, fontWeight: 700, flexShrink: 0
                  }}>
                    {u.nombre.split(" ").map(w => w[0]).join("")}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.nombre}</div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rolLabelCalculado}</div>
                  </div>

                  {/* Badge de Estado Activo */}
                  <span style={{ display: "flex", alignItems: "center", gap: 4, background: dotColor + "11", border: `1px solid ${dotColor}33`, color: dotColor, borderRadius: 10, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor }} />
                    Listo
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Características Inferiores */}
      <div className="animate-fade-in-up features-grid" style={{ maxWidth: 1200, width: "100%", margin: "60px auto 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {[
          { title: "📦 Automatización y Mínimos", desc: "El sistema alerta en tiempo real cuando el disponible de un SKU en el almacén cae por debajo del umbral mínimo de seguridad.", border: "#ef4444" },
          { title: "🛡️ Trazabilidad de Transporte", desc: "Control estricto mediante firma digital en la entrega del operador y validaciones cruzadas origen-destino.", border: "#06b6d4" },
          { title: "⚡ Aprobación Inteligente", desc: "Pedidos automáticos directos e intercepción de Supervisor para aprobaciones de flujos de alto volumen o costo.", border: "#f59e0b" }
        ].map((feat, idx) => (
          <div key={idx} style={{ background: "#111625", border: "1px solid #1e293b", borderTop: `3px solid ${feat.border}`, borderRadius: 14, padding: "20px 24px", transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = feat.border + "aa"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "#1e293b"; }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", marginBottom: 8 }}>{feat.title}</div>
            <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5, fontFamily: "sans-serif" }}>{feat.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 1200, width: "100%", margin: "80px auto 0", borderTop: "1px solid #1e293b", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#4b5563" }}>
        <div>© 2026 ControlBod SCI. Prototipo Mínimo Viable de Sistemas de Información.</div>
        <div style={{ display: "flex", gap: 20 }}>
          <span>Términos Operacionales</span>
          <span>Seguridad DB</span>
          <span>Rúbrica Evaluativa</span>
        </div>
      </div>

    </div>
  );
}