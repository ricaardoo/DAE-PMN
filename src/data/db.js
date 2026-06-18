import Dexie from "dexie";
import { STOCK_INIT, TRANSFERENCIAS_INIT } from "./mockData";

export const db = new Dexie("ControlBodDatabase");

db.version(1).stores({
  transferencias: "id, sku, origen, destino, estado, fechaCreacion",
  stock: "[bodegaId+sku], bodegaId, sku",
  logs: "++id, ts",
});

db.version(2).stores({
  transferencias: "id, sku, origen, destino, estado, fechaCreacion",
  stock: "[bodegaId+sku], bodegaId, sku",
  logs: "++id, ts",
  alertas: "++id, sku, bodegaId, estado, ts",
});

db.on("populate", () => {
  const stockPromises = [];
  Object.entries(STOCK_INIT).forEach(([bodegaId, skus]) => {
    Object.entries(skus).forEach(([sku, values]) => {
      stockPromises.push(
        db.stock.add({
          bodegaId,
          sku,
          disp: values.disp,
          comp: values.comp,
          recl: values.recl,
          min: values.min,
        })
      );
    });
  });

  const transPromises = TRANSFERENCIAS_INIT.map((t) => db.transferencias.add(t));

  const logPromises = [
    db.logs.add({
      ts: "06/05/2026 17:10",
      msg: "ST-2026-001 cerrado exitosamente. Bodega Norte +40 uds. SKU-4421.",
    }),
  ];

  return Promise.all([...stockPromises, ...transPromises, ...logPromises]);
});


export async function crearTransferencia(solicitud) {
  const { sku, origen, destino, cantidad, solicitadoPor } = solicitud;
  const cantNum = parseInt(cantidad, 10);

  // Buscar el stock en la bodega de origen para validar
  const stockOrigen = await db.stock.get({ bodegaId: origen, sku: sku });

  if (!stockOrigen || stockOrigen.disp < cantNum) {
    throw new Error(`Stock insuficiente en ${origen}. Disponible: ${stockOrigen ? stockOrigen.disp : 0}`);
  }

  const nuevaId = `ST-2026-${Date.now().toString().slice(-4)}`;
  const fechaActual = new Date().toLocaleString("es-CL");

  // Usamos una transacción para asegurar que la transferencia se cree y el stock se comprometa simultáneamente
  return await db.transaction('rw', db.transferencias, db.stock, db.logs, async () => {
    // A) Registrar la transferencia en estado "Pendiente"
    await db.transferencias.add({
      id: nuevaId,
      sku,
      origen,
      destino,
      cantidad: cantNum,
      estado: "Pendiente",
      fechaCreacion: fechaActual,
      solicitadoPor,
      historial: [{ estado: "Pendiente", usuario: solicitadoPor, ts: fechaActual }]
    });

    // B) Mover stock de "disponible" (disp) a "comprometido" (comp) en origen para que nadie más lo use
    await db.stock.update([origen, sku], {
      disp: stockOrigen.disp - cantNum,
      comp: (stockOrigen.comp || 0) + cantNum
    });

    // C) Registrar en el Log de auditoría empresarial
    await db.logs.add({
      ts: fechaActual,
      msg: `Solicitud ${nuevaId} creada por ${solicitadoPor}. ${cantNum} unidades de ${sku} retenidas en ${origen}.`
    });

    return nuevaId;
  });
}


export async function actualizarEstadoTransferencia(id, nuevoEstado, usuarioRol) {
  const fechaActual = new Date().toLocaleString("es-CL");
  const transferencia = await db.transferencias.get(id);

  if (!transferencia) throw new Error("La transferencia no existe.");

  return await db.transaction('rw', db.transferencias, db.stock, db.logs, async () => {
    const { sku, origen, destino, cantidad } = transferencia;
    const historialActualizado = [...(transferencia.historial || []), { estado: nuevoEstado, usuario: usuarioRol, ts: fechaActual }];

    // Si el flujo llega al final: "Recibido"
    if (nuevoEstado === "Recibido") {
      // 1. En Origen: Se elimina definitivamente del stock comprometido (comp)
      const stockOrigen = await db.stock.get({ bodegaId: origen, sku });
      if (stockOrigen) {
        await db.stock.update([origen, sku], {
          comp: Math.max(0, stockOrigen.comp - cantidad)
        });
      }

      // 2. En Destino: Se suma al stock disponible (disp)
      const stockDestino = await db.stock.get({ bodegaId: destino, sku });
      if (stockDestino) {
        await db.stock.update([destino, sku], {
          disp: stockDestino.disp + cantidad
        });
      } else {
        // Si no existía el registro del ítem en esa bodega, se crea
        await db.stock.add({
          bodegaId: destino,
          sku,
          disp: cantidad,
          comp: 0,
          recl: 0,
          min: 0
        });
      }

      await db.logs.add({
        ts: fechaActual,
        msg: `${id} finalizado. ${cantidad} uds de ${sku} transferidas con éxito de ${origen} a ${destino}.`
      });
    }

    // Actualizar el registro principal
    await db.transferencias.update(id, {
      estado: nuevoEstado,
      historial: historialActualizado
    });

    return true;
  });
}