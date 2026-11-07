import { compare } from "bcryptjs"
import { kv } from "@vercel/kv"

// Función para verificar credenciales
export async function verifyCredentials(email: string, password: string) {
  try {
    // Normalizar email
    const lowerEmail = email.toLowerCase()

    // Buscar usuario en KV
    const user = await kv.hgetall(`user:${lowerEmail}`)

    // Si no existe el usuario, retornar null
    if (!user || Object.keys(user).length === 0) {
      return null
    }

    // Verificar contraseña
    if (typeof user.password !== "string") return null
    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return null
    }

    // Retornar usuario sin contraseña
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error verificando credenciales:", error)
    return null
  }
}

// Función para obtener usuario por email
export async function getUserByEmail(email: string) {
  try {
    const lowerEmail = email.toLowerCase()
    const user = await kv.hgetall(`user:${lowerEmail}`)

    if (!user || Object.keys(user).length === 0) {
      return null
    }

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error obteniendo usuario:", error)
    return null
  }
}

export const authOptions = {}
