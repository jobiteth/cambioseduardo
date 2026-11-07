import bcrypt from "bcryptjs"
import { type User, UserRole, type UserResponse } from "./types"

// Fallback in-memory storage for when KV is not available
const inMemoryUsers = new Map()
const inMemoryUserCount = { count: 0 }
const inMemoryUsersList: string[] = []

// Prefijos para las claves en la base de datos
const KEYS = {
  USER: (email: string) => `user:${email.toLowerCase()}`,
  USER_COUNT: "userCount",
  USERS_LIST: "users:list",
}

// Verificar si KV está disponible
async function getKV() {
  try {
    const { kv } = await import("@vercel/kv")
    return { kv, available: true }
  } catch (error) {
    console.warn("KV no disponible, usando almacenamiento en memoria:", error)
    return { kv: null, available: false }
  }
}

// Verificar si es el primer usuario
export async function isFirstUser(): Promise<boolean> {
  try {
    const { kv, available } = await getKV()

    if (available && kv) {
      const userCount = await kv.get<number>(KEYS.USER_COUNT)
      return !userCount || userCount === 0
    } else {
      return inMemoryUserCount.count === 0
    }
  } catch (error) {
    console.error("Error verificando primer usuario:", error)
    return inMemoryUserCount.count === 0
  }
}

// Crear un nuevo usuario
export async function createUser(userData: {
  email: string
  password: string
  ip?: string
}): Promise<UserResponse | null> {
  try {
    const { email, password, ip } = userData
    const lowerEmail = email.toLowerCase()

    const { kv, available } = await getKV()

    // Verificar si el usuario ya existe
    let existingUser
    if (available && kv) {
      existingUser = await kv.hgetall(KEYS.USER(lowerEmail))
    } else {
      existingUser = inMemoryUsers.get(lowerEmail)
    }

    if (existingUser && Object.keys(existingUser).length > 0) {
      throw new Error("El usuario ya existe")
    }

    // Verificar si es el primer usuario para asignar rol
    const isFirst = await isFirstUser()
    const role = isFirst ? UserRole.ADMIN : UserRole.MEMBER

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    const now = Date.now()
    const user: User = {
      email: lowerEmail,
      password: hashedPassword,
      role,
      createdAt: now,
      ip,
    }

    // Guardar usuario
    if (available && kv) {
      await kv.hset(KEYS.USER(lowerEmail), user)
      await kv.incr(KEYS.USER_COUNT)
      await kv.lpush(KEYS.USERS_LIST, lowerEmail)
    } else {
      inMemoryUsers.set(lowerEmail, user)
      inMemoryUserCount.count++
      inMemoryUsersList.unshift(lowerEmail)
    }

    // Devolver respuesta sin contraseña
    const userResponse: UserResponse = {
      email: lowerEmail,
      role,
      createdAt: now,
    }

    return userResponse
  } catch (error) {
    console.error("Error creando usuario:", error)
    throw error
  }
}

// Obtener todos los usuarios
export async function getAllUsers(): Promise<UserResponse[]> {
  try {
    const { kv, available } = await getKV()

    let userEmails
    if (available && kv) {
      userEmails = await kv.lrange(KEYS.USERS_LIST, 0, -1)
    } else {
      userEmails = inMemoryUsersList
    }

    if (!userEmails || userEmails.length === 0) {
      return []
    }

    const users: UserResponse[] = []

    for (const email of userEmails) {
      let user
      if (available && kv) {
        user = await kv.hgetall<User>(KEYS.USER(email))
      } else {
        user = inMemoryUsers.get(email)
      }

      if (user && Object.keys(user).length > 0) {
        // Omitir la contraseña
        const { password, ...userWithoutPassword } = user
        users.push(userWithoutPassword as UserResponse)
      }
    }

    return users
  } catch (error) {
    console.error("Error obteniendo usuarios:", error)
    return []
  }
}

// Obtener un usuario por email
export async function getUserByEmail(email: string): Promise<UserResponse | null> {
  try {
    const lowerEmail = email.toLowerCase()
    const { kv, available } = await getKV()

    let user
    if (available && kv) {
      user = await kv.hgetall<User>(KEYS.USER(lowerEmail))
    } else {
      user = inMemoryUsers.get(lowerEmail)
    }

    if (!user || Object.keys(user).length === 0) {
      return null
    }

    // Omitir la contraseña
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error obteniendo usuario ${email}:`, error)
    return null
  }
}

// Verificar credenciales de usuario (para login)
export async function verifyCredentials(email: string, password: string): Promise<UserResponse | null> {
  try {
    const lowerEmail = email.toLowerCase()
    const { kv, available } = await getKV()

    let user
    if (available && kv) {
      user = await kv.hgetall<User>(KEYS.USER(lowerEmail))
    } else {
      user = inMemoryUsers.get(lowerEmail)
    }

    if (!user || Object.keys(user).length === 0) {
      return null
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return null
    }

    // Omitir la contraseña
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error verificando credenciales para ${email}:`, error)
    return null
  }
}
