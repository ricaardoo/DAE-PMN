import { useState, useEffect } from "react";
import { CATALOGOS, UMBRAL_APROBACION, UMBRAL_CANTIDAD } from "../data/mockData";
import { Modal, Input, Alert, Btn } from "./Common";

export default function NuevaSolicitud({ onClose, onCrear, stock, bodegas, usuario, initialSku }) {
  const [sku, setSku] = useState(initialSku || "");
  const [cantidad, setCantidad] = useState("");
  const [error, setError] = useState("");

  // Asigna automáticamente la bodega de destino basándose en el usuario autenticado
  const destino = usuario.bodega || bodegas[0].id;

  const getStockOtras = (targetSku) => {
    return bodegas.filter(b => b.id !== destino).reduce((acc, b) => acc + (stock[b.id]?.[targetSku]?.disp || 0), 0);
  };

  const [origen, setOrigen] = useState(() => {
    if (initialSku) {
      const stockOtras = getStockOtras(initialSku);
      return stockOtras === 0 ? "COMPRA_EXTERNA" : "";
    }
    return "";
  });

  // Si cambia el SKU seleccionado, verificar si hay stock en otras bodegas
  const handleSkuChange = (newSku) => {
    setSku(newSku);
    setError("");
    if (newSku) {
      const stockOtras = getStockOtras(newSku);
      if (stockOtras === 0) {
        setOrigen("COMPRA_EXTERNA");
      } else {
        setOrigen("");
      }
    } else {
      setOrigen("");
    }
  };

  // ─── VALIDACIONES CRÍTICAS EN CALIENTE ──────────────────────────────────
  const validar = () => {
    if (!sku) return "Selecciona un SKU válido.";
    if (!cantidad || parseInt(cantidad, 10) <= 0) return "La cantidad debe ser mayor a 0.";
    if (!origen) return "Selecciona la bodega de origen o Compra Externa.";
    if (origen === destino) return "La bodega de origen no puede ser igual a la de destino.";
    
    const skuData = CATALOGOS.find(c => c.sku === sku);
    if (!skuData) return "SKU inexistente en catálogo.";

    if (origen !== "COMPRA_EXTERNA") {
      // Lectura del mapa de stock inyectado desde la consulta en tiempo real de Dexie
      const stockOrigen = stock[origen]?.[sku];
      if (!stockOrigen) return "Este SKU no posee registros de existencias en la bodega de origen.";

      const cantSolicitada = parseInt(cantidad, 10);

      // Validación de quiebre físico absoluto de stock disponible en transferencias
      if (stockOrigen.disp < cantSolicitada) {
        return `Stock físico insuficiente en origen. Disponible actual: ${stockOrigen.disp} uds.`;
      }
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
    
    let quiebraStockMinimo = false;
    if (origen !== "COMPRA_EXTERNA") {
      const stockOrigen = stock[origen]?.[sku] || { disp: 0, min: 0 };
      const stockResultante = stockOrigen.disp - cantInt;
      quiebraStockMinimo = stockResultante < (stockOrigen.min || 0);
    }

    // REGLA DE NEGOCIO EN CALIENTE: Requiere aprobación si supera montos, volúmenes o rompe el stock mínimo de seguridad
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
  const otrasBodegas = bodegas.filter(b => b.id !== destino);
  const origenOpts = [
    ...otrasBodegas.map(b => {
      const disp = stock[b.id]?.[sku]?.disp || 0;
      return { 
        value: b.id, 
        label: `${b.nombre} (Stock disponible: ${disp} uds.)`,
        disabled: disp === 0
      };
    }),
    { value: "COMPRA_EXTERNA", label: "🛒 Compra Externa (Proveedor)" }
  ];
  const bodDest = bodegas.find(b => b.id === destino);

  // Cálculos reactivos para la alerta informativa de la interfaz
  const prod = CATALOGOS.find(c => c.sku === sku);
  const cantInt = parseInt(cantidad, 10) || 0;
  const valor = prod && cantInt ? cantInt * prod.precio : 0;
  
  const stockOrigen = stock[origen]?.[sku] || null;
  const stockResultante = stockOrigen ? stockOrigen.disp - cantInt : null;
  const quiebraStockMinimo = origen && origen !== "COMPRA_EXTERNA" && sku && cantInt > 0 && stockResultante !== null && (stockResultante < stockOrigen.min);
  
  const requiereAprobacion = valor > UMBRAL_APROBACION || cantInt > UMBRAL_CANTIDAD || quiebraStockMinimo;

  const stockOtras = sku ? getStockOtras(sku) : -1;

  return (
    <Modal title="NUEVA SOLICITUD DE REPOSICIÓN" onClose={onClose}>
      {/* Selector de Producto */}
      <Input label="SKU / Producto" value={sku} onChange={handleSkuChange} options={skuOpts} />
      
      {/* Campo de Cantidad */}
      <Input label="Cantidad solicitada" type="number" value={cantidad} onChange={v => { setCantidad(v); setError(""); }} placeholder="Unidades" />
      
      {/* Selector de Origen (Excluye automáticamente el destino para evitar redundancias) */}
      <Input label="Bodega Origen" value={origen} onChange={v => { setOrigen(v); setError(""); }} options={origenOpts} />
      
      {/* Destino Bloqueado / Automático (Asegura consistencia de permisos) */}
      <div style={{ background: "#0f1520", borderRadius: 8, padding: "10px 14px", marginBottom: 14, border: "1px solid #1f2937" }}>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", marginBottom: 2, fontWeight: 700, letterSpacing: 0.5 }}>Bodega Destino (Asignada por Rol)</div>
        <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>{bodDest?.nombre}</div>
      </div>

      {/* Alerta de Stockout Global */}
      {sku && stockOtras === 0 && (
        <div style={{ marginBottom: 14 }}>
          <Alert type="error">
            ⚠️ STOCKOUT EN RED: No hay stock disponible de este producto en ninguna otra bodega. Se ha seleccionado automáticamente la opción de **Compra Externa**.
          </Alert>
        </div>
      )}

      {/* Bloque Informativo de Existencias de Origen en Tiempo Real (Solo para transferencias) */}
      {origen && origen !== "COMPRA_EXTERNA" && sku && stockOrigen && (
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

      {/* Indicadores Dinámicos del Tipo de Flujo */}
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