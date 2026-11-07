// Estructura simplificada para las tasas
export interface Rate {
  // Tasas principales
  bcv: number
  brlSell: number
  brlBuy: number
  percentage: number

  // Metadatos
  date: string
  timestamp: number
  updatedBy: string
  updatedAt: string
}
