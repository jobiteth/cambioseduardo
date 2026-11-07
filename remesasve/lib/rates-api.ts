import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { sql } from "./db"
import { toRateResponse } from "./rate-format"

const headers = { "Cache-Control": "no-store" }

export async function getRates() {
  try {
    const rows = await sql`
      SELECT er.*, u.email AS user_email FROM exchange_rates er
      LEFT JOIN users u ON er.user_id = u.id ORDER BY er.id DESC LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ error: "No hay tasas configuradas" }, { status: 404, headers })
    return NextResponse.json(toRateResponse(rows[0]), { headers })
  } catch {
    console.error("Consulta de tasas no disponible")
    return NextResponse.json({ error: "No se pudieron consultar las tasas. Intente nuevamente." }, { status: 503, headers })
  }
}

export async function saveRates(request: Request) {
  const token = (await cookies()).get("auth-token")?.value
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return NextResponse.json({ error: "Autenticación no configurada" }, { status: 503 })
  let email: string
  try {
    const decoded = verify(token, secret, { algorithms: ["HS256"] })
    if (typeof decoded === "string" || typeof decoded.email !== "string") throw new Error("Token inválido")
    email = decoded.email
  } catch {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
  }
  let data
  try { data = await request.json() } catch {
    return NextResponse.json({ error: "Formato JSON inválido" }, { status: 400 })
  }
  if (!data || ![data.bcv, data.brlSell, data.brlBuy].every(n => typeof n === "number" && Number.isFinite(n) && n > 0 && n < 1_000_000)) {
    return NextResponse.json({ error: "Las tasas deben ser números positivos válidos" }, { status: 400 })
  }
  const percentage = data.percentage ?? ((data.brlBuy - data.brlSell) / data.brlSell) * 100
  if (typeof percentage !== "number" || !Number.isFinite(percentage) || Math.abs(percentage) >= 1000) {
    return NextResponse.json({ error: "Porcentaje inválido" }, { status: 400 })
  }
  try {
    // Permisos del usuario actual, no solamente el rol guardado en el JWT.
    const users = await sql`
      SELECT u.id, u.email, u.baneo, ul.level_name AS role FROM users u
      JOIN user_levels ul ON u.level_id = ul.id WHERE u.email = ${email}
    `
    const user = users[0]
    if (!user || user.baneo || !["administrador", "agente"].includes(String(user.role).toLowerCase())) {
      return NextResponse.json({ error: "No tiene permisos para modificar tasas" }, { status: 403 })
    }
    const rows = await sql`
      INSERT INTO exchange_rates (tasa_bcv, brl_venta, brl_compra, porcentaje, fecha, hora, user_id)
      VALUES (${data.bcv}, ${data.brlSell}, ${data.brlBuy}, ${percentage},
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas')::date,
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas')::time, ${user.id}) RETURNING *
    `
    return NextResponse.json({ success: true, ...toRateResponse({ ...rows[0], user_email: user.email }) }, { headers })
  } catch {
    console.error("No se pudieron guardar las tasas")
    return NextResponse.json({ error: "No se pudieron guardar las tasas" }, { status: 503 })
  }
}

export async function getRateHistory(limit = 50) {
  try {
    const rows = await sql`
      SELECT er.*, u.email AS user_email FROM exchange_rates er
      LEFT JOIN users u ON er.user_id = u.id ORDER BY er.id DESC LIMIT ${limit}
    `
    return NextResponse.json(rows.map(toRateResponse), { headers })
  } catch {
    return NextResponse.json({ error: "No se pudo consultar el historial" }, { status: 503, headers })
  }
}
