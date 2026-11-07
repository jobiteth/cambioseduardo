import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Eliminar cookie de sesión
    ;(await cookies()).delete("auth-token")

    // Crear respuesta
    const response = NextResponse.json({ success: true })

    // Asegurarse de que la cookie se elimina en la respuesta
    response.cookies.delete("auth-token")

    return response
  } catch (error) {
    console.error("Error en cierre de sesión:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
