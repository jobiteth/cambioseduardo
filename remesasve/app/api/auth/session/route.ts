import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getUserByEmail } from "@/lib/auth-service"

// Clave secreta para verificar tokens JWT
const JWT_SECRET = process.env.NEXTAUTH_SECRET || ""

export async function GET() {
  try {
    // Obtener token de la cookie
    const token = (await cookies()).get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    try {
      // Verificar token
      const decoded = verify(token, JWT_SECRET) as { email: string }

      // Obtener usuario
      const user = await getUserByEmail(decoded.email)

      if (!user) {
        return NextResponse.json({ user: null })
      }

      // Devolver información del usuario
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      // Token inválido
      return NextResponse.json({ user: null })
    }
  } catch (error) {
    console.error("Error obteniendo sesión:", error)
    return NextResponse.json({ user: null })
  }
}
