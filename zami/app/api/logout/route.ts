import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Eliminar cookie de sesión
    ;(await cookies()).delete("auth-token")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en cierre de sesión:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
