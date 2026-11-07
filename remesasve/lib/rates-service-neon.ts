import { executeQuery } from "./db-neon"
import { formatRateDate } from "./rate-format"

// Interfaces para los modelos de la base de datos
export interface ExchangeRate {
  id: number
  tasa_bcv: number
  brl_venta: number
  brl_compra: number
  porcentaje: number
  fecha: Date | string
  hora: string
  user_id: number | null
}

export interface ExchangeRateHistory extends ExchangeRate {
  updated_at: Date
}

// Interfaz para la respuesta de tasas
export interface RateResponse {
  bcv: number
  brlSell: number
  brlBuy: number
  percentage: number
  date: string
  time: string
  updatedBy?: string
  updatedAt?: string
}

// Obtener las tasas actuales
export async function getCurrentRates(): Promise<RateResponse | null> {
  try {
    const rates = await executeQuery<ExchangeRate[]>(`
      SELECT er.*, u.email as user_email
      FROM exchange_rates er
      LEFT JOIN users u ON er.user_id = u.id
      ORDER BY er.id DESC
      LIMIT 1
    `)

    if (rates.length === 0) {
      return null
    }

    const rate = rates[0]
    const userEmail = (rate as any).user_email

    return {
      bcv: Number(rate.tasa_bcv),
      brlSell: Number(rate.brl_venta),
      brlBuy: Number(rate.brl_compra),
      percentage: Number(rate.porcentaje),
      date: formatDate(rate.fecha),
      time: rate.hora,
      updatedBy: userEmail || "Sistema",
      updatedAt: `${formatDate(rate.fecha)} ${rate.hora}`,
    }
  } catch (error) {
    console.error("Error obteniendo tasas actuales:", error)
    return null
  }
}

// Obtener el historial de tasas
export async function getRatesHistory(limit = 10): Promise<RateResponse[]> {
  try {
    const history = await executeQuery<ExchangeRate[]>(
      `
      SELECT er.*, u.email as user_email
      FROM exchange_rates er
      LEFT JOIN users u ON er.user_id = u.id
      ORDER BY er.id DESC
      LIMIT $1
    `,
      [limit],
    )

    return history.map((rate) => {
      const userEmail = (rate as any).user_email

      return {
        bcv: Number(rate.tasa_bcv),
        brlSell: Number(rate.brl_venta),
        brlBuy: Number(rate.brl_compra),
        percentage: Number(rate.porcentaje),
        date: formatDate(rate.fecha),
        time: rate.hora,
        updatedBy: userEmail || "Sistema",
        updatedAt: `${formatDate(rate.fecha)} ${rate.hora}`,
      }
    })
  } catch (error) {
    console.error("Error obteniendo historial de tasas:", error)
    return []
  }
}

// Actualizar las tasas
export async function updateRates(
  data: {
    bcv: number
    brlSell: number
    brlBuy: number
    percentage: number
  },
  userId?: number,
): Promise<RateResponse | null> {
  try {
    // Verificar si ya existen tasas
    const existingRates = await executeQuery<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM exchange_rates
    `)

    let result

    if (Number(existingRates[0].count) === 0) {
      // Si no existen tasas, insertar nuevas
      result = await executeQuery<ExchangeRate[]>(
        `
INSERT INTO exchange_rates (tasa_bcv, brl_venta, brl_compra, porcentaje, fecha, hora, user_id)
VALUES ($1, $2, $3, $4, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas')::date, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas')::time, $5)
RETURNING *
`,
        [data.bcv, data.brlSell, data.brlBuy, data.percentage, userId || null],
      )
    } else {
      // Si existen tasas, actualizarlas
      result = await executeQuery<ExchangeRate[]>(
        `
INSERT INTO exchange_rates (tasa_bcv, brl_venta, brl_compra, porcentaje, fecha, hora, user_id)
VALUES ($1, $2, $3, $4, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas')::date, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas')::time, $5)
RETURNING *
`,
        [data.bcv, data.brlSell, data.brlBuy, data.percentage, userId || null],
      )
    }

    if (result.length === 0) {
      return null
    }

    const updatedRate = result[0]

    // Obtener el email del usuario que actualizó
    let userEmail = "Sistema"
    if (userId) {
      const userResult = await executeQuery<{ email: string }[]>(
        `
        SELECT email FROM users WHERE id = $1
      `,
        [userId],
      )

      if (userResult.length > 0) {
        userEmail = userResult[0].email
      }
    }

    return {
      bcv: Number(updatedRate.tasa_bcv),
      brlSell: Number(updatedRate.brl_venta),
      brlBuy: Number(updatedRate.brl_compra),
      percentage: Number(updatedRate.porcentaje),
      date: formatDate(updatedRate.fecha),
      time: updatedRate.hora,
      updatedBy: userEmail,
      updatedAt: `${formatDate(updatedRate.fecha)} ${updatedRate.hora}`,
    }
  } catch (error) {
    console.error("Error actualizando tasas:", error)
    return null
  }
}

// Función auxiliar para formatear fechas
const formatDate = formatRateDate
