import { useState } from "react";
import { CATALOGOS, BODEGAS_INIT, ESTADO_COLOR } from "../data/mockData";
import { Badge, Alert, Input, Btn } from "./Common";

export default function DetalleTransferencia({ t, onAccion, usuario }) {
  const [cantPicking, setCantPicking] = useState("");
  const [cantDanada, setCantDanada] = useState("");
  const [operador, setOperador] = useState(t.operador || "");

  const prod = CATALOGOS.find(c => c.sku === t.sku);

  // Mapeo dinámico y ordenado de la trazabilidad cronológica (Timeline)
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

  const estadosOrden = ["SOLICITADO", "PREPARANDO", "DISCREPANCIA_PICKING", "PREPARADO", "EN_TRANSITO", "RECEPCION_PARCIAL", "PENDIENTE_RECLAMO", "CERRADO", "CERRADO_CON_INCIDENCIA", "ANULADO"];
  const idxActual = estadosOrden.indexOf(t.estado);

  // Cálculos limpios para las validaciones locales en caliente
  const despachadoReal = t.cantidadDespacho ?? t.cantidad;
  const pickingNumeroValido = Math.min(t.cantidad, Math.max(0, parseInt(cantPicking, 10) || 0));
  const danadasNumeroValido = Math.min(despachadoReal, Math.max(0, parseInt(cantDanada, 10) || 0));

  return (
    <div style={{ fontFamily: "'DM Mono', monospace" }}>
      
      {/* Encabezado / Identificación */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>{t.id}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{prod?.nombre} — {t.sku}</div>
        </div>
        <Badge estado={t.estado} />
      </div>

      {/* Grilla Informativa de Control Operacional */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          ["Cantidad Solicitada", `${t.cantidad} uds.`],
          ["Cantidad Despacho", `${despachadoReal} uds.`],
          ["Origen", BODEGAS_INIT.find(b => b.id === t.origen)?.nombre || t.origen],
          ["Destino", BODEGAS_INIT.find(b => b.id === t.destino)?.nombre || t.destino],
          ["Solicitante", t.solicitante],
          ["Operador Logístico", t.operador || "—"],
          ["Precio Unitario", `$${prod?.precio?.toLocaleString("es-CL")}`],
          ["Valor Total", `$${(despachadoReal * (prod?.precio ?? 0)).toLocaleString("es-CL")}`],
        ].map(([k, v]) => (
          <div key={k} style={{ background: "#0f1520", borderRadius: 8, padding: "10px 14px", border: "1px solid #1f2937" }}>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Línea de Tiempo Dinámica (Trazabilidad MPN) */}
      <div style={{ marginBottom: 24, background: "#111827", padding: 14, borderRadius: 8, border: "1px solid #1f2937" }}>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>Historial de Estados / Trazabilidad</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {timeline.map((item, i) => {
            const idxItem = estadosOrden.indexOf(item.estado);
            const activo = item.fecha || idxItem <= idxActual;
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: activo ? ESTADO_COLOR[item.estado] || "#3b82f6" : "#2d3550", marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: activo ? "#e2e8f0" : "#4b5563", fontWeight: activo ? 700 : 400 }}>{item.label}</div>
                  {item.fecha && <div style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>{item.fecha}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel de Decisiones en Caliente Basado en Roles */}
      <div style={{ background: "#111622", border: "1px solid #232d42", borderRadius: 8, padding: 14, marginTop: 10 }}>
        <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 12, letterSpacing: 0.5 }}>Operaciones de Flujo de Negocio</div>

        {/* FASE: SOLICITADO */}
        {t.estado === "SOLICITADO" && usuario.rol === "SUPERVISOR" && (
          <div>
            <Alert type="warn">Esta solicitud requiere revisión por volumen/monto (${(t.valor || 0).toLocaleString("es-CL")}). Autorice o invalide la operación.</Alert>
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <Btn variant="danger" onClick={() => onAccion("ANULADO", {})}>Rechazar y Anular</Btn>
              <Btn variant="success" onClick={() => onAccion("APROBAR", {})}>Aprobar e Iniciar Flujo</Btn>
            </div>
          </div>
        )}
        {t.estado === "SOLICITADO" && usuario.rol !== "SUPERVISOR" && (
          <Alert type="info">Flujo Retenido: Esperando firma de aprobación por la Jefatura de Logística (Supervisor).</Alert>
        )}

        {/* FASE: PREPARANDO */}
        {t.estado === "PREPARANDO" && usuario.rol === "ENCARGADO_ORIGEN" && (
          <div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Efectúe el conteo en las estanterías de origen e ingrese el stock físico real:</div>
            <Input label="Unidades Físicamente Encontradas" type="number" value={cantPicking} onChange={setCantPicking} placeholder={`Esperadas en estantería: ${t.cantidad}`} />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <Btn variant="danger" onClick={() => onAccion("ANULADO", {})}>Anular Solicitud (Falta Stockout Total)</Btn>
              <Btn variant="success" onClick={() => onAccion("CONFIRMAR_PICKING", { cantPicking: pickingNumeroValido })} disabled={cantPicking === ""}>Confirmar Picking</Btn>
            </div>
          </div>
        )}

        {/* FASE: DISCREPANCIA_PICKING */}
        {t.estado === "DISCREPANCIA_PICKING" && usuario.rol === "SOLICITANTE" && (
          <div>
            <Alert type="warn">Alerta de Quiebre Parcial: El encargado físico solo encontró {t.cantidadPicking} unidades de las {t.cantidad} solicitadas originalmente. ¿Acepta la modificación?</Alert>
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <Btn variant="danger" onClick={() => onAccion("ANULADO", {})}>Rechazar y Cancelar Operación</Btn>
              <Btn variant="success" onClick={() => onAccion("ACEPTAR_PARCIAL", {})}>Aceptar Parcialidad ({t.cantidadPicking} uds.)</Btn>
            </div>
          </div>
        )}

        {/* FASE: PREPARADO */}
        {t.estado === "PREPARADO" && usuario.rol === "OPERADOR" && (
          <div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Traspaso de Responsabilidad Civil: Ingrese los datos de la patente o chofer para iniciar el tránsito:</div>
            <Input label="Identificación del Operador / Patente de Transporte" value={operador} onChange={setOperador} placeholder="Ej: Juan Reyes - Patente AB-CD-12" />
            <div style={{ display: "flex", marginTop: 12, justifyContent: "flex-end" }}>
              <Btn variant="primary" onClick={() => onAccion("FIRMAR_CUSTODIA", { operador })} disabled={!operador.trim()}>Firmar Custodia Logística</Btn>
            </div>
          </div>
        )}

        {/* FASE: EN_TRANSITO */}
        {t.estado === "EN_TRANSITO" && usuario.rol === "ENCARGADO_DESTINO" && (
          <div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Efectúe la inspección visual de recepción. Declare mermas o unidades destruidas si existiesen:</div>
            <Input label="Unidades Dañadas / Mermas Detectadas" type="number" value={cantDanada} onChange={setCantDanada} placeholder="0 (Conforme)" />
            <div style={{ display: "flex", marginTop: 12, justifyContent: "flex-end" }}>
              <Btn variant="success" onClick={() => onAccion("CONFIRMAR_RECEPCION", { cantDanada: danadasNumeroValido })} disabled={cantDanada === ""}>Confirmar y Cerrar Recepción</Btn>
            </div>
          </div>
        )}

        {/* FASE: PENDIENTE_RECLAMO */}
        {t.estado === "PENDIENTE_RECLAMO" && usuario.rol === "SUPERVISOR" && (
          <div>
            <Alert type="error">Auditoría de Daños Obligatoria: Llegaron {t.cantidadDanada} unidades rotas a destino. Evalúe el seguro y defina la resolución:</Alert>
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <Btn variant="warning" onClick={() => onAccion("RESOLVER_RECLAMO", { decision: "BAJA" })}>Merma Definitiva (Baja de Stock)</Btn>
              <Btn variant="success" onClick={() => onAccion("RESOLVER_RECLAMO", { decision: "REPONER" })}>Aprobar Reposición Inmediata</Btn>
            </div>
          </div>
        )}

        {/* Bloque Informativo de Espera Genérico */}
        {["PREPARANDO", "DISCREPANCIA_PICKING", "PREPARADO", "EN_TRANSITO"].includes(t.estado) && 
         !((t.estado === "PREPARANDO" && usuario.rol === "ENCARGADO_ORIGEN") || 
           (t.estado === "DISCREPANCIA_PICKING" && usuario.rol === "SOLICITANTE") || 
           (t.estado === "PREPARADO" && usuario.rol === "OPERADOR") || 
           (t.estado === "EN_TRANSITO" && usuario.rol === "ENCARGADO_DESTINO")) && (
          <div style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>
            Fase Pendiente: Esperando que el usuario con atribuciones de "{t.estado === "PREPARANDO" ? "Encargado de Origen" : t.estado === "DISCREPANCIA_PICKING" ? "Solicitante" : t.estado === "PREPARADO" ? "Operador" : "Encargado de Destino"}" ejecute su transacción.
          </div>
        )}

        {/* ESTADOS TERMINALES */}
        {["CERRADO", "CERRADO_CON_INCIDENCIA", "ANULADO"].includes(t.estado) && (
          <Alert type="success">✓ Operación Finalizada. Bloque de transiciones bloqueado (Estado de Solo Lectura Histórico).</Alert>
        )}
      </div>
    </div>
  );
}