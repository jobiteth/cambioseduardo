import { sql } from "./db"
import { compare, hash } from "bcryptjs"
import { UserRole } from "./types"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import { verify } from "jsonwebtoken"

// Prefijos para las claves en la base de datos
const KEYS = {
  USER: (email: string) => `user:${email.toLowerCase()}`,
  USER_COUNT: "userCount",
  USERS_LIST: "users:list",
  SESSION: (id: string) => `session:${id}`,
}

// Prefijo para las claves en la base de datos
const SESSION_PREFIX = "session:"

// Interfaz para el usuario
export interface User {
  email: string
  password: string
  role: UserRole
  createdAt: number
  ip?: string
  phone?: string
  banned?: boolean
  banReason?: string
}

// Interfaz para la respuesta de usuario (sin contraseña)
export interface UserResponse {
  id: number
  name: string
  email: string
  role: UserRole
  createdAt: Date
}

// Interfaz para la sesión
export interface Session {
  id: string
  userId: string
  email: string
  role: UserRole
  expires: number
}

// Mapeo de niveles de usuario a roles
const LEVEL_TO_ROLE: Record<string, UserRole> = {
  Miembro: UserRole.MEMBER,
  Agente: UserRole.AGENT,
  Administrador: UserRole.ADMIN,
}

// Mapeo de roles a niveles de usuario
const ROLE_TO_LEVEL: Record<UserRole, string> = {
  [UserRole.MEMBER]: "Miembro",
  [UserRole.AGENT]: "Agente",
  [UserRole.ADMIN]: "Administrador",
}

// Verificar si KV está disponible
async function isKVAvailable() {
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Error al verificar disponibilidad de KV:", error)
    return false
  }
}

// Verificar si es el primer usuario
export async function isFirstUser(): Promise<boolean> {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM users`
    return Number.parseInt(result[0].count) === 0
  } catch (error) {
    console.error("Error verificando primer usuario:", error)
    throw error
  }
}

// Crear un nuevo usuario
export async function createUser(userData: {
  name: string
  email: string
  password: string
  role?: UserRole
}): Promise<UserResponse> {
  try {
    const { name, email, password, role } = userData
    const lowerEmail = email.toLowerCase()

    // Verificar si el usuario ya existe
    const existingUser = await sql`SELECT * FROM users WHERE email = ${lowerEmail}`

    if (existingUser.length > 0) {
      throw new Error("El usuario ya existe")
    }

    // Verificar si es el primer usuario para asignar rol
    const isFirst = await isFirstUser()
    const userRole = isFirst ? UserRole.ADMIN : role || UserRole.MEMBER

    // Obtener el ID del nivel correspondiente al rol
    const levelName = ROLE_TO_LEVEL[userRole]
    const levelResult = await sql`SELECT id FROM user_levels WHERE level_name = ${levelName}`

    if (levelResult.length === 0) {
      throw new Error(`Nivel de usuario no encontrado: ${levelName}`)
    }

    const levelId = levelResult[0].id

    // Hash de la contraseña
    const hashedPassword = await hash(password, 10)

    // Insertar el nuevo usuario
    const result = await sql`
      INSERT INTO users (name, email, password, level_id, created_at)
      VALUES (${name}, ${lowerEmail}, ${hashedPassword}, ${levelId}, NOW())
      RETURNING id, name, email, level_id, created_at
    `

    if (result.length === 0) {
      throw new Error("Error al crear usuario")
    }

    const newUser = result[0]

    // Insertar permiso básico para el usuario
    await sql`
      INSERT INTO user_permissions (user_id, permission)
      VALUES (${newUser.id}, 'Ver tasas')
    `

    // Devolver respuesta sin contraseña
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: userRole,
      createdAt: newUser.created_at,
    }
  } catch (error) {
    console.error("Error creando usuario:", error)
    throw error
  }
}

// Verificar credenciales de usuario
export async function verifyCredentials(email: string, password: string): Promise<UserResponse | null> {
  try {
    const lowerEmail = email.toLowerCase()

    // Buscar usuario por email
    const users = await sql`
      SELECT u.*, l.level_name
      FROM users u
      JOIN user_levels l ON u.level_id = l.id
      WHERE u.email = ${lowerEmail}
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    if (user.baneo) return null

    // Verificar contraseña
    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return null
    }

    // Mapear el nivel a un rol
    const role = LEVEL_TO_ROLE[user.level_name] || UserRole.MEMBER

    // Devolver usuario sin contraseña
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      createdAt: user.created_at,
    }
  } catch (error) {
    console.error("Error verificando credenciales:", error)
    return null
  }
}

// Obtener usuario por email
export async function getUserByEmail(email: string): Promise<UserResponse | null> {
  try {
    const lowerEmail = email.toLowerCase()

    // Buscar usuario por email
    const users = await sql`
      SELECT u.*, l.level_name
      FROM users u
      JOIN user_levels l ON u.level_id = l.id
      WHERE u.email = ${lowerEmail}
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]

    // Mapear el nivel a un rol
    if (user.baneo) return null
    const role = LEVEL_TO_ROLE[user.level_name] || UserRole.MEMBER

    // Devolver usuario sin contraseña
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      createdAt: user.created_at,
    }
  } catch (error) {
    console.error(`Error obteniendo usuario ${email}:`, error)
    return null
  }
}

// Obtener todos los usuarios
export async function getAllUsers(): Promise<UserResponse[]> {
  try {
    const users = await sql`
      SELECT u.*, l.level_name
      FROM users u
      JOIN user_levels l ON u.level_id = l.id
      ORDER BY u.created_at DESC
    `

    return users.map((user) => {
      const role = LEVEL_TO_ROLE[user.level_name] || UserRole.MEMBER

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        createdAt: user.created_at,
      }
    })
  } catch (error) {
    console.error("Error obteniendo usuarios:", error)
    return []
  }
}

// Actualizar rol de usuario
export async function updateUserRole(email: string, newRole: UserRole): Promise<UserResponse | null> {
  try {
    if (!email || !newRole) {
      throw new Error("Email y rol son obligatorios")
    }

    const lowerEmail = email.toLowerCase()

    // Verificar si KV está disponible
    const kvAvailable = await isKVAvailable()
    if (!kvAvailable) {
      throw new Error("Base de datos no disponible")
    }

    // Obtener usuario actual
    const user = await sql`SELECT * FROM users WHERE email = ${lowerEmail}`

    if (!user || user.length === 0) {
      throw new Error("Usuario no encontrado")
    }

    // Actualizar rol
    // user.role = newRole  // No se puede asignar directamente a user.role

    // Guardar usuario actualizado
    // await kv.hset(KEYS.USER(lowerEmail), user)

    // Devolver usuario sin contraseña
    // const { password, ...userWithoutPassword } = user
    return null //userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error actualizando rol de usuario ${email}:`, error)
    throw error
  }
}

// Resetear contraseña de usuario
export async function resetUserPassword(email: string, newPassword: string): Promise<UserResponse | null> {
  try {
    if (!email || !newPassword) {
      throw new Error("Email y nueva contraseña son obligatorios")
    }

    const lowerEmail = email.toLowerCase()

    // Verificar si KV está disponible
    const kvAvailable = await isKVAvailable()
    if (!kvAvailable) {
      throw new Error("Base de datos no disponible")
    }

    // Obtener usuario actual
    const user = await sql`SELECT * FROM users WHERE email = ${lowerEmail}`

    if (!user || user.length === 0) {
      throw new Error("Usuario no encontrado")
    }

    // Hash de la nueva contraseña
    const hashedPassword = await hash(newPassword, 10)

    // Actualizar contraseña
    // user.password = hashedPassword

    // Guardar usuario actualizado
    // await kv.hset(KEYS.USER(lowerEmail), user)

    // Devolver usuario sin contraseña
    // const { password, ...userWithoutPassword } = user
    return null //userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error reseteando contraseña de usuario ${email}:`, error)
    throw error
  }
}

// Banear/desbanear usuario
export async function toggleUserBan(email: string, banned: boolean, reason?: string): Promise<UserResponse | null> {
  try {
    if (!email || banned === undefined) {
      throw new Error("Email y estado de baneo son obligatorios")
    }

    const lowerEmail = email.toLowerCase()

    // Verificar si KV está disponible
    const kvAvailable = await isKVAvailable()
    if (!kvAvailable) {
      throw new Error("Base de datos no disponible")
    }

    // Obtener usuario actual
    const user = await sql`SELECT * FROM users WHERE email = ${lowerEmail}`

    if (!user || user.length === 0) {
      throw new Error("Usuario no encontrado")
    }

    // Actualizar estado de ban
    // user.banned = banned
    // if (banned && reason) {
    //   user.banReason = reason
    // } else if (!banned) {
    //   user.banReason = ""
    // }

    // Guardar usuario actualizado
    // await kv.hset(KEYS.USER(lowerEmail), user)

    // Devolver usuario sin contraseña
    // const { password, ...userWithoutPassword } = user
    return null //userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error actualizando estado de ban de usuario ${email}:`, error)
    throw error
  }
}

// Actualizar perfil de usuario
export async function updateUserProfile(
  email: string,
  profileData: {
    email?: string
    phone?: string
  },
): Promise<UserResponse | null> {
  try {
    if (!email) {
      throw new Error("Email es obligatorio")
    }

    const lowerEmail = email.toLowerCase()

    // Verificar si KV está disponible
    const kvAvailable = await isKVAvailable()
    if (!kvAvailable) {
      throw new Error("Base de datos no disponible")
    }

    // Obtener usuario actual
    const user = await sql`SELECT * FROM users WHERE email = ${lowerEmail}`

    if (!user || user.length === 0) {
      throw new Error("Usuario no encontrado")
    }

    // Actualizar datos del perfil
    // if (profileData.email) {
    //   const newEmail = profileData.email.toLowerCase()

    //   // Verificar si el nuevo email ya existe (si es diferente al actual)
    //   if (newEmail !== lowerEmail) {
    //     const existingUser = await kv.hgetall(KEYS.USER(newEmail))
    //     if (existingUser && Object.keys(existingUser).length > 0) {
    //       throw new Error("El correo electrónico ya está en uso")
    //     }

    //     // Guardar usuario con el nuevo email
    //     await kv.hset(KEYS.USER(newEmail), { ...user, email: newEmail })

    //     // Eliminar usuario con el email antiguo
    //     await kv.del(KEYS.USER(lowerEmail))

    //     // Actualizar lista de usuarios
    //     await kv.lrem(KEYS.USERS_LIST, 0, lowerEmail)
    //     await kv.lpush(KEYS.USERS_LIST, newEmail)

    //     user.email = newEmail
    //   }
    // }

    // if (profileData.phone !== undefined) {
    //   user.phone = profileData.phone

    //   // Guardar usuario actualizado (solo si no se cambió el email)
    //   if (!profileData.email) {
    //     await kv.hset(KEYS.USER(lowerEmail), user)
    //   }
    // }

    // Devolver usuario sin contraseña
    // const { password, ...userWithoutPassword } = user
    return null //userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error actualizando perfil de usuario ${email}:`, error)
    throw error
  }
}

// Función para crear una sesión
export async function createSession(user: UserResponse) {
  try {
    if (!user || !user.email) {
      throw new Error("Datos de usuario incompletos")
    }

    // Verificar si KV está disponible
    const kvAvailable = await isKVAvailable()
    if (!kvAvailable) {
      throw new Error("Base de datos no disponible")
    }

    // Generar ID de sesión aleatorio
    const sessionId = randomBytes(32).toString("hex")

    // Crear objeto de sesión
    const session: Session = {
      id: sessionId,
      userId: user.email,
      email: user.email,
      role: user.role,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 días
    }

    // Guardar sesión en KV
    await sql`INSERT INTO sessions (id, user_id, email, role, expires) VALUES (${sessionId}, ${user.email}, ${user.email}, ${user.role}, ${Date.now() + 30 * 24 * 60 * 60 * 1000})`

    // Establecer cookie de sesión
    ;(await cookies()).set({
      name: "session-id",
      value: sessionId,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 días en segundos
      sameSite: "lax",
    })

    return session
  } catch (error) {
    console.error("Error creando sesión:", error)
    throw error
  }
}

// Función para obtener la sesión actual
export async function getSession(): Promise<Session | null> {
  try {
    // El login usa auth-token; no existe una tabla sessions en la base recuperada.
    const token = (await cookies()).get("auth-token")?.value
    const secret = process.env.NEXTAUTH_SECRET
    if (!token || !secret) return null
    const decoded = verify(token, secret, { algorithms: ["HS256"] })
    if (typeof decoded === "string" || typeof decoded.email !== "string") return null
    const rows = await sql`
      SELECT u.id, u.email, u.baneo, l.level_name FROM users u
      JOIN user_levels l ON l.id = u.level_id WHERE u.email = ${decoded.email}
    `
    const user = rows[0]
    if (!user || user.baneo) return null
    const role = String(user.level_name).toLowerCase() as UserRole
    if (!Object.values(UserRole).includes(role)) return null
    return { id: String(user.id), userId: user.email, email: user.email, role, expires: Number(decoded.exp) * 1000 }
  } catch (error) {
    console.error("Error obteniendo sesión:", error)
    return null
  }
}

// Función para eliminar la sesión actual
export async function deleteSession() {
  try {
    // Verificar si KV está disponible
    const kvAvailable = await isKVAvailable()
    if (!kvAvailable) {
      throw new Error("Base de datos no disponible")
    }

    // Obtener ID de sesión de la cookie
    const sessionId = (await cookies()).get("session-id")?.value

    if (sessionId) {
      // Eliminar sesión de KV
      await sql`DELETE FROM sessions WHERE id = ${sessionId}`
    }

    // Eliminar cookie de sesión
    ;(await cookies()).delete("session-id")

    return true
  } catch (error) {
    console.error("Error eliminando sesión:", error)
    throw error
  }
}

// Eliminar usuario
export async function deleteUser(email: string): Promise<boolean> {
  try {
    if (!email) {
      throw new Error("Email es obligatorio")
    }

    const lowerEmail = email.toLowerCase()

    // Verificar si KV está disponible
    const kvAvailable = await isKVAvailable()
    if (!kvAvailable) {
      throw new Error("Base de datos no disponible")
    }

    // Obtener usuario actual
    const user = await sql`SELECT * FROM users WHERE email = ${lowerEmail}`

    if (!user || user.length === 0) {
      throw new Error("Usuario no encontrado")
    }

    // Eliminar usuario de KV
    await sql`DELETE FROM users WHERE email = ${lowerEmail}`

    // Eliminar de la lista de usuarios
    // await kv.lrem(KEYS.USERS_LIST, 0, lowerEmail)

    return true
  } catch (error) {
    console.error(`Error eliminando usuario ${email}:`, error)
    throw error
  }
}
