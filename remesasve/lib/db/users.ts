"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth-service"
import { UserRole } from "@/lib/types"

export async function getUsers() {
  try {
    if ((await getSession())?.role !== UserRole.ADMIN) return []
    const users = await sql`
      SELECT u.id, u.name, u.email, u.level_id, u.created_at, u.baneo, u.phone, ul.level_name
      FROM users u
      LEFT JOIN user_levels ul ON u.level_id = ul.id
      ORDER BY u.name
    `
    return users
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return []
  }
}

export async function getUserLevels() {
  try {
    if ((await getSession())?.role !== UserRole.ADMIN) return []
    const levels = await sql`
      SELECT id, level_name
      FROM user_levels
      ORDER BY id
    `
    return levels
  } catch (error) {
    console.error("Error al obtener niveles de usuario:", error)
    return []
  }
}

export async function getUserById(id: number) {
  try {
    const session = await getSession()
    if (!session || (session.role !== UserRole.ADMIN && Number(session.id) !== id)) return null
    const [user] = await sql`
      SELECT u.id, u.name, u.email, u.level_id, u.created_at, u.baneo, u.phone, ul.level_name
      FROM users u
      LEFT JOIN user_levels ul ON u.level_id = ul.id
      WHERE u.id = ${id}
    `
    return user
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    return null
  }
}
