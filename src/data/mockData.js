export const CATALOGOS = [
  { sku: "SKU-4421", nombre: "Tornillo Hexagonal M8", precio: 8000 },
  { sku: "SKU-9901", nombre: "Perno Allen M10", precio: 5500 },
  { sku: "SKU-1102", nombre: "Tuerca Ciega M6", precio: 3200 },
  { sku: "SKU-3310", nombre: "Arandela Plana 1/2\"", precio: 1800 },
  { sku: "SKU-7750", nombre: "Remache Pop 4mm", precio: 950 },
];

export const BODEGAS_INIT = [
  { id: "BOD-NORTE", nombre: "Bodega Norte", encargado: "Ana Torres" },
  { id: "BOD-SUR",   nombre: "Bodega Sur",   encargado: "Carlos Vega" },
  { id: "BOD-CENTRO",nombre: "Bodega Centro",encargado: "Luis Mora" },
];

export const STOCK_INIT = {
  "BOD-NORTE": { 
    "SKU-4421": { disp: 12, comp: 0, recl: 0, min: 30 }, 
    "SKU-9901": { disp: 45, comp: 0, recl: 0, min: 20 }, 
    "SKU-1102": { disp: 80, comp: 0, recl: 0, min: 30 }, 
    "SKU-3310": { disp: 200, comp: 0, recl: 0, min: 50 }, 
    "SKU-7750": { disp: 15, comp: 0, recl: 0, min: 40 } 
  },
  "BOD-SUR": { 
    "SKU-4421": { disp: 200, comp: 0, recl: 0, min: 80 }, 
    "SKU-9901": { disp: 40, comp: 0, recl: 0, min: 30 }, 
    "SKU-1102": { disp: 150, comp: 0, recl: 0, min: 50 }, 
    "SKU-3310": { disp: 300, comp: 0, recl: 0, min: 80 }, 
    "SKU-7750": { disp: 90, comp: 0, recl: 0, min: 25 } 
  },
  "BOD-CENTRO": { 
    "SKU-4421": { disp: 55, comp: 0, recl: 0, min: 20 }, 
    "SKU-9901": { disp: 20, comp: 0, recl: 0, min: 25 }, 
    "SKU-1102": { disp: 30, comp: 0, recl: 0, min: 20 }, 
    "SKU-3310": { disp: 60, comp: 0, recl: 0, min: 30 }, 
    "SKU-7750": { disp: 10, comp: 0, recl: 0, min: 15 } 
  },
};

export const TRANSFERENCIAS_INIT = [
  { id: "ST-2026-001", sku: "SKU-4421", skuNombre: "Tornillo Hexagonal M8", cantidad: 40, origen: "BOD-SUR", destino: "BOD-NORTE", estado: "CERRADO", solicitante: "Ana Torres", fechaCreacion: "2026-05-06 09:15", fechaCierre: "2026-05-06 17:10", operador: "Pedro Soto" },
];

export const UMBRAL_APROBACION = 500000;
export const UMBRAL_CANTIDAD = 500;

export const ESTADOS_LABEL = {
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

export const ESTADO_COLOR = {
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

export const USUARIOS = [
  { id: 1, nombre: "Ana Torres", rol: "SOLICITANTE", bodega: "BOD-NORTE", rolLabel: "Solicitante — Bodega Norte" },
  { id: 2, nombre: "Carlos Vega", rol: "ENCARGADO_ORIGEN", bodega: "BOD-SUR", rolLabel: "Encargado Origen — Bodega Sur" },
  { id: 3, nombre: "Luis Mora", rol: "ENCARGADO_ORIGEN", bodega: "BOD-CENTRO", rolLabel: "Encargado — Bodega Centro" },
  { id: 4, nombre: "Pedro Soto", rol: "OPERADOR", bodega: null, rolLabel: "Operador de Transporte" },
  { id: 5, nombre: "Jefa Logística", rol: "SUPERVISOR", bodega: null, rolLabel: "Supervisora / Autorizadora" },
  { id: 6, nombre: "Admin", rol: "ADMIN", bodega: null, rolLabel: "Administrador del Sistema" },
];
