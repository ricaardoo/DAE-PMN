import { useState } from "react";
import { CATALOGOS, UMBRAL_APROBACION, UMBRAL_CANTIDAD } from "../data/mockData";
import { Modal, Input, Alert, Btn } from "./Common";

export default function NuevaSolicitud({ onClose, onCrear, stock, bodegas, usuario }) {
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
