import { useState } from "react";
import { CATALOGOS, BODEGAS_INIT, ESTADO_COLOR } from "../data/mockData";
import { Badge, Alert, Input, Btn } from "./Common";

export default function DetalleTransferencia({ t, onAccion, usuario }) {
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
      {t.estado === "SOLICITADO" && usuario.rol === "SUPERVISOR" && (
        <div>
          <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Aprobación de Supervisor</div>
          <Alert type="warn">Esta solicitud supera los límites permitidos (${t.valor?.toLocaleString("es-CL")} o {t.cantidad} uds.) y requiere su aprobación.</Alert>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="success" onClick={() => onAccion("APROBAR", {})}>Aprobar Solicitud</Btn>
            <Btn variant="danger" onClick={() => onAccion("ANULAR", {})}>Rechazar / Anular</Btn>
          </div>
        </div>
      )}

      {t.estado === "SOLICITADO" && usuario.rol !== "SUPERVISOR" && (
        <Alert type="info">Esta solicitud requiere aprobación de la Jefa de Logística (Supervisor).</Alert>
      )}

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

      {["PREPARANDO","DISCREPANCIA_PICKING","PREPARADO"].includes(t.estado) && usuario.rol !== "ENCARGADO_ORIGEN" && usuario.rol !== "SOLICITANTE" && usuario.rol !== "SUPERVISOR" && (
        <Alert type="info">Este estado requiere acción de otro actor del proceso.</Alert>
      )}

      {["CERRADO","CERRADO_CON_INCIDENCIA","ANULADO"].includes(t.estado) && (
        <Alert type="success">Transferencia finalizada. Estado terminal.</Alert>
      )}
    </div>
  );
}
