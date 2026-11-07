import { NextResponse } from "next/server"
import { createUser, isFirstUser } from "@/lib/auth-service"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    // Obtener datos del cuerpo de la solicitud
    const { name, email, password } = await request.json()

    // Validar datos
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nombre, email y contraseña son requeridos" }, { status: 400 })
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

    const configs = await sql`SELECT disable_registration FROM site_config ORDER BY id DESC LIMIT 1`
    if (configs[0]?.disable_registration) {
      return NextResponse.json({ error: "El registro está deshabilitado" }, { status: 403 })
    }

    // Crear usuario
    const user = await createUser({
      name,
      email,
      password,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Error en registro:", error)

    // Manejar error específico de usuario existente
    if (error instanceof Error && error.message === "El usuario ya existe") {
      return NextResponse.json({ error: "El correo electrónico ya está registrado" }, { status: 409 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en el servidor" },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const isFirst = await isFirstUser()
    return NextResponse.json({ isFirst })
  } catch (error) {
    console.error("Error verificando primer usuario:", error)
    return NextResponse.json({ error: "Error al verificar primer usuario" }, { status: 500 })
  }
}
