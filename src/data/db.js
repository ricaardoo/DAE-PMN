import Dexie from "dexie";
import { STOCK_INIT, TRANSFERENCIAS_INIT } from "./mockData";

export const db = new Dexie("ControlBodDatabase");

db.version(1).stores({
  transferencias: "id, sku, origen, destino, estado, fechaCreacion",
  stock: "[bodegaId+sku], bodegaId, sku",
  logs: "++id, ts",
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
