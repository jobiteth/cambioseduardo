"use server"

import { sql } from "@/lib/db"
import { errorMessage } from "@/lib/error-message"
import { getSession } from "@/lib/auth-service"
import { UserRole } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { hash } from "@/lib/auth/password"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) throw new Error("No autorizado")
}

export async function updateUser({
  id,
  name,
  email,
}: {
  id: number
  name: string
  email: string
}) {
  try {
    await requireAdmin()
    // Verificar si el email ya existe (excepto para el usuario actual)
    if (email) {
      const existingUser = await sql`
        SELECT id FROM users 
        WHERE email = ${email} AND id != ${id}
      `

      if (existingUser.length > 0) {
        throw new Error("El email ya está en uso por otro usuario")
      }
    }

    const [updatedUser] = await sql`
      UPDATE users SET 
        name = ${name}, 
        email = ${email}
      WHERE id = ${id} 
      RETURNING id, name, email, level_id, created_at, baneo, phone
    `

    revalidatePath("/admin/usuarios")
    return updatedUser
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    throw new Error(errorMessage(error) || "No se pudo actualizar el usuario")
  }
}

export async function updateUserRole({
  id,
  level_id,
}: {
  id: number
  level_id: number
}) {
  try {
    await requireAdmin()
    const [updatedUser] = await sql`
      UPDATE users SET 
        level_id = ${level_id}
      WHERE id = ${id} 
      RETURNING id, name, email, level_id, created_at, baneo, phone
    `

    revalidatePath("/admin/usuarios")
    return updatedUser
  } catch (error) {
    console.error("Error al actualizar rol:", error)
    throw new Error(errorMessage(error) || "No se pudo actualizar el rol")
  }
}

export async function updateUserPhone({
  id,
  phone,
}: {
  id: number
  phone: string
}) {
  try {
    await requireAdmin()
    const [updatedUser] = await sql`
      UPDATE users SET 
        phone = ${phone}
      WHERE id = ${id} 
      RETURNING id, name, email, level_id, created_at, baneo, phone
    `

    revalidatePath("/admin/usuarios")
    return updatedUser
  } catch (error) {
    console.error("Error al actualizar teléfono:", error)
    throw new Error(errorMessage(error) || "No se pudo actualizar el teléfono")
  }
}

export async function updateUserPassword({
  id,
  password,
}: {
  id: number
  password: string
}) {
  try {
    await requireAdmin()
    // Hashear la contraseña
    const hashedPassword = await hash(password)

    await sql`
      UPDATE users SET
        password = ${hashedPassword}
      WHERE id = ${id}
    `

    revalidatePath("/admin/usuarios")
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar contraseña:", error)
    throw new Error(errorMessage(error) || "No se pudo actualizar la contraseña")
  }
}

export async function toggleUserBan({
  id,
  baneo,
}: {
  id: number
  baneo: boolean
}) {
  try {
    await requireAdmin()
    const [updatedUser] = await sql`
      UPDATE users SET 
        baneo = ${baneo}
      WHERE id = ${id} 
      RETURNING id, name, email, level_id, created_at, baneo, phone
    `

    revalidatePath("/admin/usuarios")
    return updatedUser
  } catch (error) {
    console.error("Error al actualizar estado de baneo:", error)
    throw new Error(errorMessage(error) || "No se pudo actualizar el estado de baneo")
  }
}

export async function createUser({
  name,
  email,
  password,
  level_id,
  phone,
}: {
  name: string
  email: string
  password: string
  level_id: number
  phone: string | null
}) {
  try {
    await requireAdmin()
    // Verificar si el email ya existe
    const existingUser = await sql`
      SELECT id FROM users 
      WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      throw new Error("El email ya está en uso")
    }

    // Hashear la contraseña
    const hashedPassword = await hash(password)

    // Crear el usuario
    const [newUser] = await sql`
      INSERT INTO users (name, email, password, level_id, phone, baneo)
      VALUES (${name}, ${email}, ${hashedPassword}, ${level_id}, ${phone}, false)
      RETURNING id, name, email, level_id, created_at, baneo, phone
    `

    revalidatePath("/admin/usuarios")
    return newUser
  } catch (error) {
    console.error("Error al crear usuario:", error)
    throw new Error(errorMessage(error) || "No se pudo crear el usuario")
  }
}

export async function deleteUser(id: number) {
  try {
    await sql`
      DELETE FROM users
      WHERE id = ${id}
    `

    revalidatePath("/admin/usuarios")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    throw new Error("No se pudo eliminar el usuario")
  }
}
