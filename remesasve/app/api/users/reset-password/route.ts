import { NextResponse } from "next/server"
import { resetUserPassword } from "@/lib/auth-service"
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
    const { email, password } = await request.json()

    // Validar datos
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Resetear contraseña del usuario
    const updatedUser = await resetUserPassword(email, password)

    if (!updatedUser) {
      return NextResponse.json({ error: "Error al resetear la contraseña del usuario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error reseteando contraseña de usuario:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en el servidor" },
      { status: 500 },
    )
  }
}
