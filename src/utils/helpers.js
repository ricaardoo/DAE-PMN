export function now() {
  return new Date().toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function nextId(transferencias) {
  return `ST-2026-${String(transferencias.length + 1).padStart(3, "0")}`;
}
