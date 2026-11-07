import { NextResponse } from "next/server"
import { deleteUser } from "@/lib/auth-service"
import { getSession } from "@/lib/auth-service"
import { UserRole } from "@/lib/types"

export async function DELETE(request: Request) {
  try {
    // Verificar si el usuario está autenticado y es administrador
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const { email } = await request.json()

    // Validar datos
    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    // No permitir eliminar al propio usuario
    if (email === session.email) {
      return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
    }

    // Eliminar usuario
    const success = await deleteUser(email)

    if (!success) {
      return NextResponse.json({ error: "Error al eliminar el usuario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado correctamente",
    })
  } catch (error) {
    console.error("Error eliminando usuario:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en el servidor" },
      { status: 500 },
    )
  }
}
