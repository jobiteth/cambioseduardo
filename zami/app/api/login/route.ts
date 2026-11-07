import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verifyCredentials } from "@/lib/auth"
import { sign } from "jsonwebtoken"

// Clave secreta para firmar tokens JWT
const JWT_SECRET = process.env.NEXTAUTH_SECRET || ""

export async function POST(request: Request) {
  if (!JWT_SECRET) return NextResponse.json({ error: "Autenticación no configurada" }, { status: 503 })
  try {
    // Obtener credenciales del cuerpo de la solicitud
    const { email, password } = await request.json()

    // Validar datos
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Verificar credenciales
    const user = await verifyCredentials(email, password)

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Crear token JWT
    const token = sign(
      {
        id: user.email,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" },
    )

    // Establecer cookie de sesión
    ;(await cookies()).set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 días
    })

    // Retornar usuario sin contraseña
    return NextResponse.json({
      user: {
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Error en inicio de sesión:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
