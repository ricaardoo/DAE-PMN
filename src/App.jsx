import { useState, useEffect } from "react";

// ─── DATOS FICTICIOS ────────────────────────────────────────────────────────
const CATALOGOS = [
  { sku: "SKU-4421", nombre: "Tornillo Hexagonal M8", precio: 8000 },
  { sku: "SKU-9901", nombre: "Perno Allen M10", precio: 5500 },
  { sku: "SKU-1102", nombre: "Tuerca Ciega M6", precio: 3200 },
  { sku: "SKU-3310", nombre: "Arandela Plana 1/2\"", precio: 1800 },
  { sku: "SKU-7750", nombre: "Remache Pop 4mm", precio: 950 },
];

const BODEGAS_INIT = [
  { id: "BOD-NORTE", nombre: "Bodega Norte", encargado: "Ana Torres" },
  { id: "BOD-SUR",   nombre: "Bodega Sur",   encargado: "Carlos Vega" },
  { id: "BOD-CENTRO",nombre: "Bodega Centro",encargado: "Luis Mora" },
];

const STOCK_INIT = {
  "BOD-NORTE": { "SKU-4421": { disp: 12, comp: 0, recl: 0, min: 30 }, "SKU-9901": { disp: 45, comp: 0, recl: 0, min: 20 }, "SKU-1102": { disp: 80, comp: 0, recl: 0, min: 30 }, "SKU-3310": { disp: 200, comp: 0, recl: 0, min: 50 }, "SKU-7750": { disp: 15, comp: 0, recl: 0, min: 40 } },
  "BOD-SUR":   { "SKU-4421": { disp: 200, comp: 0, recl: 0, min: 80 }, "SKU-9901": { disp: 40, comp: 0, recl: 0, min: 30 }, "SKU-1102": { disp: 150, comp: 0, recl: 0, min: 50 }, "SKU-3310": { disp: 300, comp: 0, recl: 0, min: 80 }, "SKU-7750": { disp: 90, comp: 0, recl: 0, min: 25 } },
  "BOD-CENTRO":{ "SKU-4421": { disp: 55, comp: 0, recl: 0, min: 20 }, "SKU-9901": { disp: 20, comp: 0, recl: 0, min: 25 }, "SKU-1102": { disp: 30, comp: 0, recl: 0, min: 20 }, "SKU-3310": { disp: 60, comp: 0, recl: 0, min: 30 }, "SKU-7750": { disp: 10, comp: 0, recl: 0, min: 15 } },
};

const TRANSFERENCIAS_INIT = [
  { id: "ST-2026-001", sku: "SKU-4421", skuNombre: "Tornillo Hexagonal M8", cantidad: 40, origen: "BOD-SUR", destino: "BOD-NORTE", estado: "CERRADO", solicitante: "Ana Torres", fechaCreacion: "2026-05-06 09:15", fechaCierre: "2026-05-06 17:10", operador: "Pedro Soto" },
];

const UMBRAL_APROBACION = 500000;
const UMBRAL_CANTIDAD = 500;

const ESTADOS_LABEL = {
  SOLICITADO: "Solicitado",
  PREPARANDO: "Preparando",
  DISCREPANCIA_PICKING: "Discrepancia Picking",
  PREPARADO: "Preparado",
  EN_TRANSITO: "En Tránsito",
  RECEPCION_PARCIAL: "Recepción Parcial",
  PENDIENTE_RECLAMO: "Pendiente Reclamo",
  CERRADO: "Cerrado",
  CERRADO_CON_INCIDENCIA: "Cerrado c/ Incidencia",
  ANULADO: "Anulado",
};

const ESTADO_COLOR = {
  SOLICITADO: "#3b82f6",
  PREPARANDO: "#8b5cf6",
  DISCREPANCIA_PICKING: "#f59e0b",
  PREPARADO: "#06b6d4",
  EN_TRANSITO: "#f97316",
  RECEPCION_PARCIAL: "#ef4444",
  PENDIENTE_RECLAMO: "#dc2626",
  CERRADO: "#22c55e",
  CERRADO_CON_INCIDENCIA: "#84cc16",
  ANULADO: "#6b7280",
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
function now() {
  return new Date().toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function nextId(transferencias) {
  return `ST-2026-${String(transferencias.length + 1).padStart(3, "0")}`;
}

// ─── COMPONENTES UI ─────────────────────────────────────────────────────────
function Badge({ estado }) {
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

function Modal({ title, onClose, children }) {
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

function Btn({ children, onClick, variant = "primary", disabled = false, small = false }) {
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

function Input({ label, value, onChange, type = "text", options, placeholder }) {
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

function Alert({ type, children }) {
  const colors = { info: "#3b82f6", warn: "#f59e0b", error: "#ef4444", success: "#22c55e" };
  const c = colors[type] || colors.info;
  return (
    <div style={{ background: c + "15", border: `1px solid ${c}44`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: c, marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ─── PANTALLA: DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ transferencias, stock, bodegas, onNueva, onVerDetalle, usuario }) {
  const activas = transferencias.filter(t => !["CERRADO","CERRADO_CON_INCIDENCIA","ANULADO"].includes(t.estado));
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
          { label: "En Tránsito", val: transferencias.filter(t=>t.estado==="EN_TRANSITO").length, color: "#f97316" },
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

// ─── PANTALLA: INVENTARIO ─────────────────────────────────────────────────────
function Inventario({ stock, bodegas }) {
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

// ─── PANTALLA: DETALLE DE TRANSFERENCIA ──────────────────────────────────────
function DetalleTransferencia({ t, onClose, onAccion, stock, usuario }) {
  const [cantPicking, setCantPicking] = useState("");
  const [cantDanada, setCantDanada] = useState("");
  const [operador, setOperador] = useState(t.operador || "");

  const prod = CATALOGOS.find(c => c.sku === t.sku);

  const timeline = [
    { estado: "SOLICITADO", label: "Solicitud Creada", fecha: t.fechaCreacion },
    { estado: "PREPARANDO", label: "Validación S.C.I.", fecha: t.fechaPreparando },
    { estado: "DISCREPANCIA_PICKING", label: "Discrepancia Picking", fecha: t.fechaDiscrepancia, omitir: !t.fechaDiscrepancia },
    { estado: "PREPARADO", label: "Picking Confirmado", fecha: t.fechaPreparado },
    { estado: "EN_TRANSITO", label: "En Tránsito", fecha: t.fechaTransito },
    { estado: "RECEPCION_PARCIAL", label: "Recepción con Daño", fecha: t.fechaRecepcionParcial, omitir: !t.fechaRecepcionParcial },
    { estado: "CERRADO", label: "Transferencia Cerrada", fecha: t.fechaCierre },
    { estado: "CERRADO_CON_INCIDENCIA", label: "Cerrada con Incidencia", fecha: t.fechaCierre, omitir: t.estado !== "CERRADO_CON_INCIDENCIA" },
    { estado: "ANULADO", label: "Anulado", fecha: t.fechaAnulado, omitir: t.estado !== "ANULADO" },
  ].filter(x => !x.omitir);

  const estadosOrden = ["SOLICITADO","PREPARANDO","DISCREPANCIA_PICKING","PREPARADO","EN_TRANSITO","RECEPCION_PARCIAL","PENDIENTE_RECLAMO","CERRADO","CERRADO_CON_INCIDENCIA","ANULADO"];
  const idxActual = estadosOrden.indexOf(t.estado);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{t.id}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{prod?.nombre} — {t.sku}</div>
        </div>
        <Badge estado={t.estado} />
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          ["Cantidad Solicitada", `${t.cantidad} uds.`],
          ["Cantidad Despacho", `${t.cantidadDespacho ?? t.cantidad} uds.`],
          ["Origen", BODEGAS_INIT.find(b=>b.id===t.origen)?.nombre],
          ["Destino", BODEGAS_INIT.find(b=>b.id===t.destino)?.nombre],
          ["Solicitante", t.solicitante],
          ["Operador", t.operador || "—"],
          ["Precio Unit.", `$${prod?.precio?.toLocaleString("es-CL")}`],
          ["Valor Total", `$${((t.cantidadDespacho??t.cantidad) * (prod?.precio??0)).toLocaleString("es-CL")}`],
        ].map(([k,v]) => (
          <div key={k} style={{ background: "#0f1520", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Timeline</div>
        {timeline.map((item, i) => {
          const idxItem = estadosOrden.indexOf(item.estado);
          const activo = item.fecha || idxItem <= idxActual;
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: activo ? ESTADO_COLOR[item.estado] || "#3b82f6" : "#2d3550", marginTop: 3, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: activo ? "#e2e8f0" : "#4b5563", fontWeight: activo ? 700 : 400 }}>{item.label}</div>
                {item.fecha && <div style={{ fontSize: 10, color: "#6b7280" }}>{item.fecha}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Acciones según estado y rol */}
      {t.estado === "PREPARANDO" && usuario.rol === "ENCARGADO_ORIGEN" && (
        <div>
          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Confirmar Picking Físico</div>
          <Input label="Unidades físicamente encontradas" type="number" value={cantPicking} onChange={setCantPicking} placeholder={`Esperadas: ${t.cantidad}`} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn variant="success" onClick={() => onAccion("CONFIRMAR_PICKING", { cantPicking: parseInt(cantPicking) || t.cantidad })}
              disabled={!cantPicking}>Confirmar Picking</Btn>
            <Btn variant="danger" onClick={() => onAccion("ANULAR", {})}>Anular Solicitud</Btn>
          </div>
        </div>
      )}

      {t.estado === "DISCREPANCIA_PICKING" && usuario.rol === "SOLICITANTE" && (
        <div>
          <Alert type="warn">Picking físico incompleto: solo {t.cantidadPicking} de {t.cantidad} unidades disponibles. ¿Acepta transferencia parcial?</Alert>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="success" onClick={() => onAccion("ACEPTAR_PARCIAL", {})}>Aceptar {t.cantidadPicking} uds.</Btn>
            <Btn variant="danger" onClick={() => onAccion("ANULAR", {})}>Rechazar / Anular</Btn>
          </div>
        </div>
      )}

      {t.estado === "PREPARADO" && usuario.rol === "OPERADOR" && (
        <div>
          <div style={{ fontSize: 11, color: "#06b6d4", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Firma Digital de Custodia</div>
          <Input label="Nombre del operador (firma digital)" value={operador} onChange={setOperador} placeholder="Nombre completo" />
          <Btn variant="primary" onClick={() => onAccion("FIRMAR_CUSTODIA", { operador })} disabled={!operador}>Firmar y Despachar</Btn>
        </div>
      )}

      {t.estado === "EN_TRANSITO" && usuario.rol === "ENCARGADO_DESTINO" && (
        <div>
          <div style={{ fontSize: 11, color: "#f97316", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Confirmar Recepción</div>
          <Input label="Unidades dañadas detectadas (0 si ninguna)" type="number" value={cantDanada} onChange={setCantDanada} placeholder="0" />
          <Btn variant="success" onClick={() => onAccion("CONFIRMAR_RECEPCION", { cantDanada: parseInt(cantDanada) || 0 })}
            disabled={cantDanada === ""}>Confirmar Recepción</Btn>
        </div>
      )}

      {t.estado === "PENDIENTE_RECLAMO" && usuario.rol === "SUPERVISOR" && (
        <div>
          <Alert type="error">{t.cantidadDanada} unidades en estado RECLAMO. Evalúe el acta y resuelva.</Alert>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn variant="success" onClick={() => onAccion("RESOLVER_RECLAMO", { decision: "REPONER" })}>Reponer Unidades</Btn>
            <Btn variant="warning" onClick={() => onAccion("RESOLVER_RECLAMO", { decision: "BAJA" })}>Dar de Baja</Btn>
          </div>
        </div>
      )}

      {["SOLICITADO","PREPARANDO","DISCREPANCIA_PICKING","PREPARADO"].includes(t.estado) && usuario.rol !== "ENCARGADO_ORIGEN" && usuario.rol !== "SOLICITANTE" && usuario.rol !== "SUPERVISOR" && (
        <Alert type="info">Este estado requiere acción de otro actor del proceso.</Alert>
      )}

      {["CERRADO","CERRADO_CON_INCIDENCIA","ANULADO"].includes(t.estado) && (
        <Alert type="success">Transferencia finalizada. Estado terminal.</Alert>
      )}
    </div>
  );
}

// ─── MODAL: NUEVA SOLICITUD ───────────────────────────────────────────────────
function NuevaSolicitud({ onClose, onCrear, stock, bodegas, usuario }) {
  const [sku, setSku] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [origen, setOrigen] = useState("");
  const [error, setError] = useState("");

  const destino = bodegas.find(b => b.encargado === usuario.nombre)?.id || bodegas[0].id;

  const validar = () => {
    if (!sku) return "Selecciona un SKU válido.";
    if (!cantidad || parseInt(cantidad) <= 0) return "La cantidad debe ser mayor a 0.";
    if (!origen) return "Selecciona la bodega de origen.";
    if (origen === destino) return "La bodega de origen no puede ser igual al destino.";
    const skuData = CATALOGOS.find(c => c.sku === sku);
    if (!skuData) return "SKU inexistente en catálogo.";
    const stockOrigen = stock[origen]?.[sku];
    if (!stockOrigen) return "SKU no disponible en bodega origen.";
    const excedente = stockOrigen.disp - stockOrigen.comp - stockOrigen.min;
    if (excedente < parseInt(cantidad)) return `Stock cedible insuficiente. Excedente sobre mínimo: ${Math.max(0, excedente)} uds.`;
    return "";
  };

  const handleCrear = () => {
    const err = validar();
    if (err) { setError(err); return; }

    const prod = CATALOGOS.find(c => c.sku === sku);
    const valor = parseInt(cantidad) * prod.precio;
    const requiereAprobacion = valor > UMBRAL_APROBACION || parseInt(cantidad) > UMBRAL_CANTIDAD;
    onCrear({ sku, skuNombre: prod.nombre, cantidad: parseInt(cantidad), origen, destino, requiereAprobacion, valor });
    onClose();
  };

  const skuOpts = CATALOGOS.map(c => ({ value: c.sku, label: `${c.sku} — ${c.nombre}` }));
  const origenOpts = bodegas.filter(b => b.id !== destino).map(b => ({ value: b.id, label: b.nombre }));
  const bodDest = bodegas.find(b => b.id === destino);

  const prod = CATALOGOS.find(c => c.sku === sku);
  const valor = prod && cantidad ? parseInt(cantidad) * prod.precio : 0;
  const requiereAprobacion = valor > UMBRAL_APROBACION || parseInt(cantidad) > UMBRAL_CANTIDAD;

  return (
    <Modal title="NUEVA SOLICITUD DE TRANSFERENCIA" onClose={onClose}>
      <Input label="SKU / Producto" value={sku} onChange={v => { setSku(v); setError(""); }} options={skuOpts} />
      <Input label="Cantidad solicitada" type="number" value={cantidad} onChange={v => { setCantidad(v); setError(""); }} placeholder="Unidades" />
      <Input label="Bodega Origen" value={origen} onChange={v => { setOrigen(v); setError(""); }} options={origenOpts} />
      <div style={{ background: "#0f1520", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", marginBottom: 2 }}>Bodega Destino (automático)</div>
        <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>{bodDest?.nombre}</div>
      </div>

      {sku && cantidad && origen && (
        <div style={{ marginBottom: 14 }}>
          {requiereAprobacion
            ? <Alert type="warn">Valor ${valor.toLocaleString("es-CL")} supera umbral. Requiere aprobación del Supervisor.</Alert>
            : <Alert type="success">Valor ${valor.toLocaleString("es-CL")} — Flujo automático sin aprobación.</Alert>
          }
        </div>
      )}

      {error && <Alert type="error">{error}</Alert>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={handleCrear}>Crear Solicitud</Btn>
      </div>
    </Modal>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
const USUARIOS = [
  { id: 1, nombre: "Ana Torres", rol: "SOLICITANTE", bodega: "BOD-NORTE", rolLabel: "Solicitante — Bodega Norte" },
  { id: 2, nombre: "Carlos Vega", rol: "ENCARGADO_ORIGEN", bodega: "BOD-SUR", rolLabel: "Encargado Origen — Bodega Sur" },
  { id: 3, nombre: "Luis Mora", rol: "ENCARGADO_ORIGEN", bodega: "BOD-CENTRO", rolLabel: "Encargado — Bodega Centro" },
  { id: 4, nombre: "Pedro Soto", rol: "OPERADOR", bodega: null, rolLabel: "Operador de Transporte" },
  { id: 5, nombre: "Jefa Logística", rol: "SUPERVISOR", bodega: null, rolLabel: "Supervisora / Autorizadora" },
  { id: 6, nombre: "Admin", rol: "ADMIN", bodega: null, rolLabel: "Administrador del Sistema" },
];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [pantalla, setPantalla] = useState("dashboard");
  const [transferencias, setTransferencias] = useState(TRANSFERENCIAS_INIT);
  const [stock, setStock] = useState(STOCK_INIT);
  const [modalNueva, setModalNueva] = useState(false);
  const [detalleT, setDetalleT] = useState(null);
  const [log, setLog] = useState([
    { ts: "06/05/2026 17:10", msg: "ST-2026-001 cerrado exitosamente. Bodega Norte +40 uds. SKU-4421." }
  ]);

  const addLog = (msg) => setLog(prev => [{ ts: now(), msg }, ...prev.slice(0, 19)]);

  // ─── LÓGICA DE ACCIONES ──────────────────────────────────────────────────
  const handleCrearTransferencia = (data) => {
    const id = nextId(transferencias);
    const nueva = {
      id, ...data,
      solicitante: usuario.nombre,
      estado: "PREPARANDO",
      fechaCreacion: now(),
      fechaPreparando: now(),
      cantidadDespacho: data.cantidad,
    };

    setTransferencias(prev => [...prev, nueva]);

    // Comprometer stock en origen
    setStock(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      s[data.origen][data.sku].disp -= data.cantidad;
      s[data.origen][data.sku].comp += data.cantidad;
      return s;
    });

    addLog(`${id} creado. ${data.cantidad} uds. ${data.sku} comprometidas en ${BODEGAS_INIT.find(b=>b.id===data.origen)?.nombre}.`);
  };

  const handleAccion = (accion, params) => {
    const t = detalleT;
    const ts = now();

    setTransferencias(prev => prev.map(tr => {
      if (tr.id !== t.id) return tr;
      let next = { ...tr };

      if (accion === "CONFIRMAR_PICKING") {
        const cp = params.cantPicking;
        if (cp === tr.cantidad) {
          next.estado = "PREPARADO";
          next.fechaPreparado = ts;
          next.cantidadDespacho = cp;
          addLog(`${tr.id}: Picking conforme. ${cp} uds. confirmadas.`);
        } else if (cp < tr.cantidad && cp > 0) {
          next.estado = "DISCREPANCIA_PICKING";
          next.fechaDiscrepancia = ts;
          next.cantidadPicking = cp;
          addLog(`${tr.id}: Discrepancia picking. Físico: ${cp}, Solicitado: ${tr.cantidad}.`);
        } else {
          next.estado = "ANULADO";
          next.fechaAnulado = ts;
          addLog(`${tr.id}: Anulado. Picking sin stock físico.`);
        }
      }

      if (accion === "ACEPTAR_PARCIAL") {
        // liberar la diferencia de stock comprometido
        setStock(prev2 => {
          const s = JSON.parse(JSON.stringify(prev2));
          const diff = tr.cantidad - tr.cantidadPicking;
          s[tr.origen][tr.sku].comp -= diff;
          s[tr.origen][tr.sku].disp += diff;
          return s;
        });
        next.estado = "PREPARADO";
        next.fechaPreparado = ts;
        next.cantidadDespacho = tr.cantidadPicking;
        next.cantidad = tr.cantidadPicking;
        addLog(`${tr.id}: Transferencia parcial aceptada. Ajustado a ${tr.cantidadPicking} uds.`);
      }

      if (accion === "FIRMAR_CUSTODIA") {
        next.estado = "EN_TRANSITO";
        next.fechaTransito = ts;
        next.operador = params.operador;
        // comp → trans (en stock lo marcamos visualmente liberando comp)
        setStock(prev2 => {
          const s = JSON.parse(JSON.stringify(prev2));
          s[tr.origen][tr.sku].comp -= next.cantidadDespacho;
          return s;
        });
        addLog(`${tr.id}: En tránsito. Operador: ${params.operador}. Despacho: ${next.cantidadDespacho} uds.`);
      }

      if (accion === "CONFIRMAR_RECEPCION") {
        const danadas = params.cantDanada;
        const conformes = (next.cantidadDespacho ?? tr.cantidad) - danadas;
        if (danadas === 0) {
          // Cierre normal
          next.estado = "CERRADO";
          next.fechaCierre = ts;
          setStock(prev2 => {
            const s = JSON.parse(JSON.stringify(prev2));
            s[tr.origen][tr.sku].disp -= (next.cantidadDespacho ?? tr.cantidad);
            // En origen ya se descontó al comprometer, aquí solo ajustamos destino
            s[tr.destino][tr.sku].disp += (next.cantidadDespacho ?? tr.cantidad);
            return s;
          });
          addLog(`${tr.id}: Cerrado. ${next.cantidadDespacho ?? tr.cantidad} uds. recibidas en ${BODEGAS_INIT.find(b=>b.id===tr.destino)?.nombre}.`);
        } else {
          // Con daño
          next.estado = "PENDIENTE_RECLAMO";
          next.fechaRecepcionParcial = ts;
          next.cantidadDanada = danadas;
          next.cantidadConforme = conformes;
          setStock(prev2 => {
            const s = JSON.parse(JSON.stringify(prev2));
            s[tr.destino][tr.sku].disp += conformes;
            s[tr.destino][tr.sku].recl += danadas;
            return s;
          });
          addLog(`${tr.id}: Recepción con daño. ${conformes} conformes, ${danadas} en RECLAMO.`);
        }
      }

      if (accion === "RESOLVER_RECLAMO") {
        next.estado = "CERRADO_CON_INCIDENCIA";
        next.fechaCierre = ts;
        if (params.decision === "REPONER") {
          setStock(prev2 => {
            const s = JSON.parse(JSON.stringify(prev2));
            s[tr.destino][tr.sku].disp += tr.cantidadDanada;
            s[tr.destino][tr.sku].recl -= tr.cantidadDanada;
            return s;
          });
          addLog(`${tr.id}: Reclamo resuelto. ${tr.cantidadDanada} uds. repuestas.`);
        } else {
          setStock(prev2 => {
            const s = JSON.parse(JSON.stringify(prev2));
            s[tr.destino][tr.sku].recl -= tr.cantidadDanada;
            return s;
          });
          addLog(`${tr.id}: Reclamo resuelto. ${tr.cantidadDanada} uds. dadas de baja.`);
        }
      }

      if (accion === "ANULAR") {
        next.estado = "ANULADO";
        next.fechaAnulado = ts;
        // devolver stock comprometido
        setStock(prev2 => {
          const s = JSON.parse(JSON.stringify(prev2));
          const comp = s[tr.origen][tr.sku].comp;
          const cant = next.cantidadDespacho ?? tr.cantidad;
          s[tr.origen][tr.sku].comp -= Math.min(comp, cant);
          s[tr.origen][tr.sku].disp += Math.min(comp, cant);
          return s;
        });
        addLog(`${tr.id}: ANULADO. Stock devuelto a disponible.`);
      }

      return next;
    }));

    // Actualizar detalle visible
    setDetalleT(prev => {
      if (!prev || prev.id !== t.id) return prev;
      return transferencias.find(tr => tr.id === t.id) || prev;
    });
  };

  // Sincronizar detalleT con cambios
  useEffect(() => {
    if (detalleT) {
      const actualizado = transferencias.find(t => t.id === detalleT.id);
      if (actualizado) setDetalleT(actualizado);
    }
  }, [transferencias]);

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  if (!usuario) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", padding: 20 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Syne:wght@400;700;800&display=swap');`}</style>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Sistema de Control</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Syne', sans-serif", lineHeight: 1.1 }}>Control de Bodegas<br/><span style={{ color: "#6366f1" }}>& Transferencia de Stock</span></div>
          </div>

          <div style={{ background: "#1a1f2e", border: "1px solid #2d3550", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Selecciona tu Perfil</div>
            {USUARIOS.map(u => (
              <button key={u.id} onClick={() => setUsuario(u)} style={{
                display: "block", width: "100%", padding: "12px 16px", marginBottom: 8,
                background: "#0f1520", border: "1px solid #2d3550", borderRadius: 10,
                color: "#e2e8f0", fontSize: 12, fontWeight: 700, cursor: "pointer",
                textAlign: "left", fontFamily: "'DM Mono', monospace", transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#1e2840"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2d3550"; e.currentTarget.style.background = "#0f1520"; }}>
                <div style={{ color: "#60a5fa" }}>{u.nombre}</div>
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{u.rolLabel}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── APP ─────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "inventario", label: "Inventario" },
    { id: "auditoria", label: "Auditoría" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Syne:wght@400;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Navbar */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "0 24px", display: "flex", alignItems: "center", gap: 24, height: 52 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#6366f1", fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap" }}>ControlBod.</div>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setPantalla(n.id)} style={{
            background: "none", border: "none", color: pantalla === n.id ? "#e2e8f0" : "#6b7280",
            fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
            borderBottom: pantalla === n.id ? "2px solid #3b82f6" : "2px solid transparent",
            padding: "15px 2px", transition: "all 0.15s", fontFamily: "'DM Mono', monospace"
          }}>
            {n.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 700 }}>{usuario.nombre}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>{usuario.rolLabel}</div>
          </div>
          <button onClick={() => setUsuario(null)} style={{
            background: "#1f2937", border: "1px solid #374151", color: "#9ca3af",
            borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace"
          }}>Salir</button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Syne', sans-serif" }}>
            {pantalla === "dashboard" && "Dashboard de Transferencias"}
            {pantalla === "inventario" && "Estado de Inventario"}
            {pantalla === "auditoria" && "Log de Auditoría"}
          </div>
        </div>

        {pantalla === "dashboard" && (
          <Dashboard
            transferencias={transferencias}
            stock={stock}
            bodegas={BODEGAS_INIT}
            onNueva={() => setModalNueva(true)}
            onVerDetalle={t => setDetalleT(t)}
            usuario={usuario}
          />
        )}

        {pantalla === "inventario" && (
          <Inventario stock={stock} bodegas={BODEGAS_INIT} />
        )}

        {pantalla === "auditoria" && (
          <div style={{ background: "#1a1f2e", border: "1px solid #2d3550", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #2d3550", fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Registro de Eventos — {log.length} eventos
            </div>
            {log.length === 0 && <div style={{ padding: 24, color: "#4b5563", textAlign: "center", fontSize: 13 }}>Sin eventos registrados</div>}
            {log.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "10px 18px", borderBottom: "1px solid #1e2535", fontSize: 12 }}>
                <span style={{ color: "#6b7280", whiteSpace: "nowrap", fontSize: 11 }}>{e.ts}</span>
                <span style={{ color: "#d1d5db" }}>{e.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nueva Solicitud */}
      {modalNueva && (
        <NuevaSolicitud
          onClose={() => setModalNueva(false)}
          onCrear={handleCrearTransferencia}
          stock={stock}
          bodegas={BODEGAS_INIT}
          usuario={usuario}
        />
      )}

      {/* Modal Detalle */}
      {detalleT && (
        <Modal title={`DETALLE — ${detalleT.id}`} onClose={() => setDetalleT(null)}>
          <DetalleTransferencia
            t={detalleT}
            onClose={() => setDetalleT(null)}
            onAccion={(accion, params) => {
              handleAccion(accion, params);
              setDetalleT(null);
            }}
            stock={stock}
            usuario={usuario}
          />
        </Modal>
      )}
    </div>
  );
}
