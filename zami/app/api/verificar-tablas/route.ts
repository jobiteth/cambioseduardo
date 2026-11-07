import { NextResponse } from "next/server"
import { sql, queryRows } from "@/lib/db"
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

    // Verificar rol (solo administrador puede ver esta información)
    if ((await getSession())?.role !== "administrador") {
      return NextResponse.json({ error: "No tiene permisos para esta acción" }, { status: 403 })
    }

    // Lista de tablas a verificar
    const tablasAVerificar = [
      "exchange_rates",
      "exchangezami_rates",
      "site_config",
      "site_config_zami",
      "site_access_key",
      "users",
      "user_levels",
    ]

    // Verificar cada tabla
    const resultados = []

    for (const tabla of tablasAVerificar) {
      try {
        // Verificar si la tabla existe
        const existsResult = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = ${tabla}
          ) as exists
        `

        const exists = existsResult[0].exists

        // Si la tabla existe, contar registros
        let count = 0
        if (exists) {
          // Identificador de la lista fija anterior, no un valor del usuario.
          const countResult = await queryRows(`SELECT COUNT(*) as count FROM "${tabla}"`)
          count = Number.parseInt(countResult[0].count)
        }

        resultados.push({
          table_name: tabla,
          exists: exists,
          record_count: count,
        })
      } catch (error) {
        console.error(`Error verificando tabla ${tabla}:`, error)
        resultados.push({
          table_name: tabla,
          exists: false,
          record_count: 0,
          error: String(error),
        })
      }
    }

    return NextResponse.json({ tablas: resultados })
  } catch (error) {
    console.error("Error al verificar tablas:", error)
    return NextResponse.json({ error: "Error al verificar tablas", details: String(error) }, { status: 500 })
  }
}
