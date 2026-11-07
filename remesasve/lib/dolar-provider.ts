export interface DolarRate {
  fuente: string
  nombre: string
  compra: number | null
  venta: number | null
  promedio: number
  fechaActualizacion: string
}

export function formatBcv(value: number): string {
  if (!Number.isFinite(value) || value <= 0 || value >= 1_000_000) {
    throw new Error("La tasa BCV debe ser un número positivo válido")
  }
  // Redondeo decimal a dos cifras, sin truncar (incluye casos como 1.005).
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false,
  }).format(value)
}

export function parseDolarRates(data: unknown): DolarRate[] {
  if (!Array.isArray(data)) throw new Error("Respuesta inválida de DolarAPI")
  const rates: DolarRate[] = data.filter((item): item is DolarRate =>
    item !== null && typeof item === "object" &&
    typeof item.fuente === "string" && typeof item.nombre === "string" &&
    typeof item.promedio === "number" && Number.isFinite(item.promedio) &&
    item.promedio > 0 && item.promedio < 1_000_000 &&
    typeof item.fechaActualizacion === "string" && Number.isFinite(Date.parse(item.fechaActualizacion)),
  )
  if (!rates.some(rate => rate.fuente.toLowerCase() === "oficial")) {
    throw new Error("DolarAPI no devolvió una tasa oficial válida")
  }
  return rates
}
