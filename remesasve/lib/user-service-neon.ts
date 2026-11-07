import { executeQuery } from "./db-neon"
import { compare, hash } from "bcryptjs"
import { UserRole } from "./types"

// Interfaces para los modelos de la base de datos
interface DbUser {
  id: number
  name: string
  email: string
  password: string
  level_id: number
  created_at: Date
}

interface DbUserLevel {
  id: number
  level_name: string
}

// Mapeo de roles de usuario
const USER_LEVEL_MAP: Record<string, UserRole> = {
  Miembro: UserRole.MEMBER,
  Agente: UserRole.AGENT,
  Administrador: UserRole.ADMIN,
}

const ROLE_TO_LEVEL_MAP: Record<UserRole, string> = {
  [UserRole.MEMBER]: "Miembro",
  [UserRole.AGENT]: "Agente",
  [UserRole.ADMIN]: "Administrador",
}

// Interfaz para la respuesta de usuario (sin contraseña)
export interface UserResponse {
  id: number
  name: string
  email: string
  role: UserRole
  createdAt: Date
}

// Verificar si es el primer usuario
export async function isFirstUser(): Promise<boolean> {
  try {
    const result = await executeQuery<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM users
    `)
    return result[0].count === 0
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
    const existingUser = await executeQuery<DbUser[]>(
      `
      SELECT * FROM users WHERE email = $1
    `,
      [lowerEmail],
    )

    if (existingUser.length > 0) {
      throw new Error("El usuario ya existe")
    }

    // Verificar si es el primer usuario para asignar rol
    const isFirst = await isFirstUser()
    const userRole = isFirst ? UserRole.ADMIN : role || UserRole.MEMBER

    // Obtener el ID del nivel correspondiente al rol
    const levelName = ROLE_TO_LEVEL_MAP[userRole]
    const levelResult = await executeQuery<DbUserLevel[]>(
      `
      SELECT id FROM user_levels WHERE level_name = $1
    `,
      [levelName],
    )

    if (levelResult.length === 0) {
      throw new Error(`Nivel de usuario no encontrado: ${levelName}`)
    }

    const levelId = levelResult[0].id

    // Hash de la contraseña
    const hashedPassword = await hash(password, 10)

    // Insertar el nuevo usuario
    const result = await executeQuery<DbUser[]>(
      `
      INSERT INTO users (name, email, password, level_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `,
      [name, lowerEmail, hashedPassword, levelId],
    )

    const newUser = result[0]

    // Insertar permiso básico para el usuario
    await executeQuery(
      `
      INSERT INTO user_permissions (user_id, permission)
      VALUES ($1, 'Ver tasas')
    `,
      [newUser.id],
    )

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
    const users = await executeQuery<DbUser[]>(
      `
      SELECT u.*, l.level_name
      FROM users u
      JOIN user_levels l ON u.level_id = l.id
      WHERE u.email = $1
    `,
      [lowerEmail],
    )

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    const levelName = (users[0] as any).level_name

    // Verificar contraseña
    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return null
    }

    // Mapear el nivel a un rol
    const role = USER_LEVEL_MAP[levelName] || UserRole.MEMBER

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
    const users = await executeQuery<DbUser[]>(
      `
      SELECT u.*, l.level_name
      FROM users u
      JOIN user_levels l ON u.level_id = l.id
      WHERE u.email = $1
    `,
      [lowerEmail],
    )

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    const levelName = (users[0] as any).level_name

    // Mapear el nivel a un rol
    const role = USER_LEVEL_MAP[levelName] || UserRole.MEMBER

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
    const users = await executeQuery<DbUser[]>(`
      SELECT u.*, l.level_name
      FROM users u
      JOIN user_levels l ON u.level_id = l.id
      ORDER BY u.created_at DESC
    `)

    return users.map((user) => {
      const levelName = (user as any).level_name
      const role = USER_LEVEL_MAP[levelName] || UserRole.MEMBER

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
    const lowerEmail = email.toLowerCase()

    // Obtener el ID del nivel correspondiente al rol
    const levelName = ROLE_TO_LEVEL_MAP[newRole]
    const levelResult = await executeQuery<DbUserLevel[]>(
      `
      SELECT id FROM user_levels WHERE level_name = $1
    `,
      [levelName],
    )

    if (levelResult.length === 0) {
      throw new Error(`Nivel de usuario no encontrado: ${levelName}`)
    }

    const levelId = levelResult[0].id

    // Actualizar el nivel del usuario
    const result = await executeQuery<DbUser[]>(
      `
      UPDATE users
      SET level_id = $1
      WHERE email = $2
      RETURNING *
    `,
      [levelId, lowerEmail],
    )

    if (result.length === 0) {
      return null
    }

    const updatedUser = result[0]

    // Devolver usuario actualizado
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: newRole,
      createdAt: updatedUser.created_at,
    }
  } catch (error) {
    console.error(`Error actualizando rol de usuario ${email}:`, error)
    throw error
  }
}

// Resetear contraseña de usuario
export async function resetUserPassword(email: string, newPassword: string): Promise<UserResponse | null> {
  try {
    const lowerEmail = email.toLowerCase()

    // Hash de la nueva contraseña
    const hashedPassword = await hash(newPassword, 10)

    // Actualizar la contraseña del usuario
    const result = await executeQuery<DbUser[]>(
      `
      UPDATE users
      SET password = $1
      WHERE email = $2
      RETURNING *
    `,
      [hashedPassword, lowerEmail],
    )

    if (result.length === 0) {
      return null
    }

    const updatedUser = result[0]

    // Obtener el rol del usuario
    const levelResult = await executeQuery<DbUserLevel[]>(
      `
      SELECT l.level_name
      FROM user_levels l
      JOIN users u ON u.level_id = l.id
      WHERE u.id = $1
    `,
      [updatedUser.id],
    )

    const levelName = levelResult[0].level_name
    const role = USER_LEVEL_MAP[levelName] || UserRole.MEMBER

    // Devolver usuario actualizado
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role,
      createdAt: updatedUser.created_at,
    }
  } catch (error) {
    console.error(`Error reseteando contraseña de usuario ${email}:`, error)
    throw error
  }
}

// Eliminar usuario
export async function deleteUser(email: string): Promise<boolean> {
  try {
    const lowerEmail = email.toLowerCase()

    // Eliminar el usuario
    const result = await executeQuery<{ count: number }[]>(
      `
      DELETE FROM users
      WHERE email = $1
      RETURNING id
    `,
      [lowerEmail],
    )

    return result.length > 0
  } catch (error) {
    console.error(`Error eliminando usuario ${email}:`, error)
    throw error
  }
}
