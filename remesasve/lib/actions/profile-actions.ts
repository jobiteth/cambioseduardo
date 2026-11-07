"use server"

import { sql } from "@/lib/db"
import { errorMessage } from "@/lib/error-message"
import { revalidatePath } from "next/cache"
import { hash, verify } from "@/lib/auth/password"
import { cookies } from "next/headers"
import { verify as verifyJwt } from "jsonwebtoken"

// Clave secreta para verificar tokens JWT
const JWT_SECRET = process.env.NEXTAUTH_SECRET || ""

// Obtener el usuario actual desde la cookie de sesión
async function getCurrentUser() {
  try {
    const token = (await cookies()).get("auth-token")?.value

    if (!token) {
      return null
    }

    const decoded = verifyJwt(token, JWT_SECRET) as { id: number; email: string }

    const [user] = await sql`
      SELECT id, name, email, password, level_id, phone, baneo
      FROM users
      WHERE email = ${decoded.email}
    `

    return user && !user.baneo ? user : null
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error)
    return null
  }
}

export async function updateUserProfile({
  name,
  email,
  phone,
}: {
  name: string
  email: string
  phone?: string
}) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, error: "No se encontró la sesión del usuario" }
    }

    // Verificar si el email ya existe (excepto para el usuario actual)
    if (email !== currentUser.email) {
      const existingUser = await sql`
        SELECT id FROM users 
        WHERE email = ${email} AND id != ${currentUser.id}
      `

      if (existingUser.length > 0) {
        return { success: false, error: "El email ya está en uso por otro usuario" }
      }
    }

    // Actualizar perfil
    await sql`
      UPDATE users SET 
        name = ${name}, 
        email = ${email},
        phone = ${phone || null}
      WHERE id = ${currentUser.id}
    `

    // Si el email cambió, actualizar el token JWT
    if (email !== currentUser.email) {
      // Aquí se podría implementar la actualización del token
      // Por ahora, simplemente indicamos que se debe recargar la página
    }

    revalidatePath("/perfil")
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar perfil:", error)
    return { success: false, error: errorMessage(error) || "Error al actualizar el perfil" }
  }
}

export async function updateUserPassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, error: "No se encontró la sesión del usuario" }
    }

    // Verificar contraseña actual
    const isPasswordValid = await verify(currentPassword, currentUser.password)

    if (!isPasswordValid) {
      return { success: false, error: "La contraseña actual es incorrecta" }
    }

    // Hashear la nueva contraseña
    const hashedPassword = await hash(newPassword)

    // Actualizar contraseña
    await sql`
      UPDATE users SET 
        password = ${hashedPassword}
      WHERE id = ${currentUser.id}
    `

    revalidatePath("/perfil")
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar contraseña:", error)
    return { success: false, error: errorMessage(error) || "Error al actualizar la contraseña" }
  }
}
