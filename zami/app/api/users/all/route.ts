import { type NextRequest, NextResponse } from "next/server"
import { getAllUsers } from "@/lib/user-service"

export async function GET(request: NextRequest) {
  try {
    // Aquí deberíamos verificar si el usuario es administrador
    // Por ahora, simplemente devolvemos todos los usuarios
    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error obteniendo usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
