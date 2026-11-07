import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { getSession } from "@/lib/auth-service"

// Clave secreta para verificar tokens JWT
const JWT_SECRET = process.env.NEXTAUTH_SECRET || ""

export async function DELETE(request: Request) {
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

    // Verificar rol (solo administrador o agente pueden eliminar)
    const session = await getSession()
    if (!session || !["administrador", "agente"].includes(session.role)) {
      return NextResponse.json({ error: "No tiene permisos para esta acción" }, { status: 403 })
    }

    // Obtener ID de la entrada a eliminar
    const data = await request.json()
    const { id } = data

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }

    // Verificar si la entrada existe
    const checkResult = await sql`SELECT COUNT(*) as count FROM exchangezami_rates WHERE id = ${id}`

    if (Number(checkResult[0].count) === 0) {
      return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 })
    }

    // Eliminar la entrada
    await sql`DELETE FROM exchangezami_rates WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar entrada del historial:", error)
    return NextResponse.json({ error: "Error al eliminar entrada del historial" }, { status: 500 })
  }
}
