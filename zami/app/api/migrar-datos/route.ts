import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { getSession } from "@/lib/auth-service"

// Clave secreta para verificar tokens JWT
const JWT_SECRET = process.env.NEXTAUTH_SECRET || ""

export async function GET(request: Request) {
  try {
    // Verificar autenticación mediante el token JWT
    const token = (await cookies()).get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar y decodificar el token
    let decoded
    try {
      decoded = verify(token, JWT_SECRET) as { email: string; role: string }
    } catch (error) {
      console.error("Error al verificar token:", error)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Verificar rol (solo administrador puede migrar datos)
    if ((await getSession())?.role !== "administrador") {
      return NextResponse.json({ error: "No tiene permisos para esta acción" }, { status: 403 })
    }

    // Verificar si hay datos en exchangezami_rates
    const countResult = await sql`SELECT COUNT(*) as count FROM exchangezami_rates`
    const count = Number.parseInt(countResult[0].count)

    // Si ya hay datos, no hacer nada
    if (count > 0) {
      return NextResponse.json({
        message: "La tabla exchangezami_rates ya contiene datos",
        count: count,
      })
    }

    // Copiar datos de exchange_rates a exchangezami_rates
    const result = await sql`
      INSERT INTO exchangezami_rates (
        tasa_bcv, 
        brl_venta, 
        brl_compra, 
        porcentaje, 
        fecha, 
        hora, 
        user_id
      )
      SELECT 
        tasa_bcv, 
        brl_venta, 
        brl_compra, 
        porcentaje, 
        fecha, 
        hora, 
        user_id
      FROM exchange_rates
    `

    // Verificar cuántos registros se copiaron
    const newCountResult = await sql`SELECT COUNT(*) as count FROM exchangezami_rates`
    const newCount = Number.parseInt(newCountResult[0].count)

    return NextResponse.json({
      success: true,
      message: "Datos migrados correctamente",
      count: newCount,
    })
  } catch (error) {
    console.error("Error al migrar datos:", error)
    return NextResponse.json({ error: "Error al migrar datos", details: String(error) }, { status: 500 })
  }
}
