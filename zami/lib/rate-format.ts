export function formatRateDate(value: string | Date): string {
  // DATE de PostgreSQL no es un instante UTC: evitar desplazarlo al día anterior.
  const date = typeof value === "string" ? value.slice(0, 10) :
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Fecha de tasa inválida")
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

export function toRateResponse(row: any) {
  const result = {
    id: Number(row.id),
    bcv: Number(row.tasa_bcv),
    brlSell: Number(row.brl_venta),
    brlBuy: Number(row.brl_compra),
    percentage: Number(row.porcentaje ?? 0),
    date: formatRateDate(row.fecha),
    time: String(row.hora).slice(0, 5),
    updatedBy: row.user_email || "Sistema",
    updatedAt: "",
  }
  if (![result.bcv, result.brlSell, result.brlBuy].every(n => Number.isFinite(n) && n > 0) ||
      !Number.isFinite(result.percentage)) throw new Error("Tasas inválidas en la base de datos")
  result.updatedAt = `${result.date} ${result.time}`
  return result
}
