import { NextResponse } from "next/server"
import { createUser } from "@/lib/auth-service"
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
    const body = await request.text()
    let data

    try {
      data = JSON.parse(body)
    } catch (e) {
      return NextResponse.json({ error: "Formato JSON inválido" }, { status: 400 })
    }

    const { email, password, role } = data

    // Validar datos
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
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
      name: data.name || email.split("@")[0],
      email,
      password,
      role: role || UserRole.MEMBER,
    })

    if (!user) {
      return NextResponse.json({ error: "Error al crear el usuario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Error en creación de usuario:", error)

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
