import { type NextRequest, NextResponse } from "next/server"
import { createUser, isFirstUser } from "@/lib/user-service"

export async function POST(request: NextRequest) {
  try {
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()
    const { email, password } = data

    // Validar datos
    if (!email || !password) {
      return NextResponse.json({ error: "El correo y la contraseña son obligatorios" }, { status: 400 })
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Formato de correo electrónico inválido" }, { status: 400 })
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Obtener IP del cliente
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "desconocida"

    // Crear usuario
    const user = await createUser({
      email,
      password,
      ip: ip.split(",")[0].trim(), // Tomar solo la primera IP si hay varias
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error en registro de usuario:", error)

    // Manejar error específico de usuario existente
    if (error instanceof Error && error.message === "El usuario ya existe") {
      return NextResponse.json({ error: "El correo electrónico ya está registrado" }, { status: 409 })
    }

    return NextResponse.json({ error: "Error al crear el usuario" }, { status: 500 })
  }
}

// Endpoint para verificar si es el primer usuario
export async function GET() {
  try {
    const isFirst = await isFirstUser()
    return NextResponse.json({ isFirst })
  } catch (error) {
    console.error("Error verificando primer usuario:", error)
    return NextResponse.json({ error: "Error al verificar primer usuario" }, { status: 500 })
  }
}
