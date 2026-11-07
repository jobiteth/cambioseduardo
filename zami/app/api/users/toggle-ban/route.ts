import { NextResponse } from "next/server"
import { toggleUserBan } from "@/lib/auth-service"
import { getSession } from "@/lib/auth-service"
import { UserRole } from "@/lib/types"

export async function POST(request: Request) {
  try {
    // Verificar si el usuario está autenticado y es administrador
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const { email, banned, reason } = await request.json()

    // Validar datos
    if (!email || banned === undefined) {
      return NextResponse.json({ error: "Email y estado de baneo son requeridos" }, { status: 400 })
    }

    // Si se está baneando, se requiere una razón
    if (banned && !reason) {
      return NextResponse.json({ error: "Se requiere una razón para el baneo" }, { status: 400 })
    }

    // Banear/desbanear usuario
    const updatedUser = await toggleUserBan(email, banned, reason)

    if (!updatedUser) {
      return NextResponse.json({ error: "Error al actualizar el estado de baneo del usuario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error actualizando estado de baneo de usuario:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en el servidor" },
      { status: 500 },
    )
  }
}
