import { NextResponse } from "next/server"
import { updateUserProfile } from "@/lib/auth-service"
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
    const { email, phone } = await request.json()

    // Validar datos
    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    // Actualizar perfil del usuario
    const updatedUser = await updateUserProfile(email, { phone })

    if (!updatedUser) {
      return NextResponse.json({ error: "Error al actualizar el perfil del usuario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error actualizando perfil de usuario:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en el servidor" },
      { status: 500 },
    )
  }
}
