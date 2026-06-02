import { useState } from "react";
import { CATALOGOS, UMBRAL_APROBACION, UMBRAL_CANTIDAD } from "../data/mockData";
import { Modal, Input, Alert, Btn } from "./Common";

export default function NuevaSolicitud({ onClose, onCrear, stock, bodegas, usuario }) {
  const [sku, setSku] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [origen, setOrigen] = useState("");
  const [error, setError] = useState("");

  // Asigna automáticamente la bodega de destino basándose en el usuario autenticado
  const destino = bodegas.find(b => b.encargado === usuario.nombre)?.id || bodegas[0].id;

  // ─── VALIDACIONES CRÍTICAS EN CALIENTE ──────────────────────────────────
  const validar = () => {
    if (!sku) return "Selecciona un SKU válido.";
    if (!cantidad || parseInt(cantidad, 10) <= 0) return "La cantidad debe ser mayor a 0.";
    if (!origen) return "Selecciona la bodega de origen.";
    if (origen === destino) return "La bodega de origen no puede ser igual a la de destino.";
    
    const skuData = CATALOGOS.find(c => c.sku === sku);
    if (!skuData) return "SKU inexistente en catálogo.";

    // Lectura del mapa de stock inyectado desde la consulta en tiempo real de Dexie
    const stockOrigen = stock[origen]?.[sku];
    if (!stockOrigen) return "Este SKU no posee registros de existencias en la bodega de origen.";

    const cantSolicitada = parseInt(cantidad, 10);

    // Validación de quiebre físico absoluto de stock disponible
    if (stockOrigen.disp < cantSolicitada) {
      return `Stock físico insuficiente en origen. Disponible actual: ${stockOrigen.disp} uds.`;
    }

    return "";
  };

  const handleCrear = () => {
    const err = validar();
    if (err) { 
      setError(err); 
      return; 
    }

    const prod = CATALOGOS.find(c => c.sku === sku);
    const cantInt = parseInt(cantidad, 10);
    const valor = cantInt * prod.precio;
    
    // Obtener información de stock para evaluar la regla de negocio del stock mínimo
    const stockOrigen = stock[origen]?.[sku] || { disp: 0, min: 0 };
    const stockResultante = stockOrigen.disp - cantInt;

    // REGLA DE NEGOCIO EN CALIENTE: Requiere aprobación si supera montos, volúmenes o rompe el stock mínimo de seguridad
    const quiebraStockMinimo = stockResultante < (stockOrigen.min || 0);
    const requiereAprobacion = valor > UMBRAL_APROBACION || cantInt > UMBRAL_CANTIDAD || quiebraStockMinimo;

    // Envío de la estructura limpia de datos hacia App.jsx
    onCrear({ 
      sku, 
      skuNombre: prod.nombre, 
      cantidad: cantInt, 
      origen, 
      destino, 
      requiereAprobacion, 
      valor 
    });
    
    onClose();
  };

  // Selectores dinámicos adaptados a los componentes personalizados Input
  const skuOpts = CATALOGOS.map(c => ({ value: c.sku, label: `${c.sku} — ${c.nombre}` }));
  const origenOpts = bodegas.filter(b => b.id !== destino).map(b => ({ value: b.id, label: b.nombre }));
  const bodDest = bodegas.find(b => b.id === destino);

  // Cálculos reactivos para la alerta informativa de la interfaz
  const prod = CATALOGOS.find(c => c.sku === sku);
  const cantInt = parseInt(cantidad, 10) || 0;
  const valor = prod && cantInt ? cantInt * prod.precio : 0;
  
  const stockOrigen = stock[origen]?.[sku] || { disp: 0, min: 0 };
  const stockResultante = stockOrigen.disp - cantInt;
  const quiebraStockMinimo = origen && sku && cantInt > 0 && (stockResultante < stockOrigen.min);
  
  const requiereAprobacion = valor > UMBRAL_APROBACION || cantInt > UMBRAL_CANTIDAD || quiebraStockMinimo;

  return (
    <Modal title="NUEVA SOLICITUD DE TRANSFERENCIA" onClose={onClose}>
      {/* Selector de Producto */}
      <Input label="SKU / Producto" value={sku} onChange={v => { setSku(v); setError(""); }} options={skuOpts} />
      
      {/* Campo de Cantidad */}
      <Input label="Cantidad solicitada" type="number" value={cantidad} onChange={v => { setCantidad(v); setError(""); }} placeholder="Unidades" />
      
      {/* Selector de Origen (Excluye automáticamente el destino para evitar redundancias) */}
      <Input label="Bodega Origen" value={origen} onChange={v => { setOrigen(v); setError(""); }} options={origenOpts} />
      
      {/* Destino Bloqueado / Automático (Asegura consistencia de permisos) */}
      <div style={{ background: "#0f1520", borderRadius: 8, padding: "10px 14px", marginBottom: 14, border: "1px solid #1f2937" }}>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", marginBottom: 2, fontWeight: 700, letterSpacing: 0.5 }}>Bodega Destino (Asignada por Rol)</div>
        <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>{bodDest?.nombre}</div>
      </div>

      {/* Bloque Informativo de Existencias de Origen en Tiempo Real */}
      {origen && sku && (
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700 }}>STOCK EN ORIGEN</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: stockOrigen.disp >= cantInt ? "#10b981" : "#ef4444", marginTop: 2 }}>{stockOrigen.disp} unidades</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700 }}>UMBRAL MÍNIMO</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#9ca3af", marginTop: 2 }}>{stockOrigen.min} unidades</div>
          </div>
        </div>
      )}

      {/* Indicadores Dinámicos del Tipo de Flujo (Auditoría visual requerida por rúbrica) */}
      {sku && cantInt > 0 && origen && (
        <div style={{ marginBottom: 14 }}>
          {requiereAprobacion ? (
            <Alert type="warn">
              ⚠️ REGULACIÓN: Requiere aprobación del Supervisor. {quiebraStockMinimo ? "Motivo: Operación dejará stock bajo el mínimo de seguridad." : `Motivo: Supera umbral de volumen (${UMBRAL_CANTIDAD} uds) o valorización ($${UMBRAL_APROBACION.toLocaleString("es-CL")}).`}
            </Alert>
          ) : (
            <Alert type="success">
              ✓ Flujo directo habilitado: Operación dentro de parámetros estándar (${valor.toLocaleString("es-CL")}). Procesamiento automático inmediato.
            </Alert>
          )}
        </div>
      )}

      {/* Despliegue de Errores Críticos de Validación */}
      {error && <div style={{ marginBottom: 14 }}><Alert type="error">{error}</Alert></div>}

      {/* Botonera de Control */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={handleCrear}>Crear Solicitud</Btn>
      </div>
    </Modal>
  );
}