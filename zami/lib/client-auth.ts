import { UserRole } from "./types"

// Interfaz para el usuario
export interface User {
  email: string
  password: string
  role: UserRole
  createdAt: number
  ip?: string
  banned?: boolean
  banReason?: string
  phone?: string
}

// Interfaz para la respuesta de usuario (sin contraseña)
export interface UserResponse {
  email: string
  role: UserRole
  createdAt: number
  ip?: string
  banned?: boolean
  banReason?: string
  phone?: string
}

// Verificar si es el primer usuario
export function isFirstUser(): boolean {
  try {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    return users.length === 0
  } catch (error) {
    console.error("Error verificando primer usuario:", error)
    return true
  }
}

// Crear un nuevo usuario
export function createUser(userData: {
  email: string
  password: string
  role?: UserRole
  ip?: string
  phone?: string
}): UserResponse | null {
  try {
    const { email, password, role: providedRole, ip, phone } = userData
    const lowerEmail = email.toLowerCase()

    // Obtener usuarios existentes
    const users = JSON.parse(localStorage.getItem("users") || "[]")

    // Verificar si el usuario ya existe
    if (users.some((u: any) => u.email.toLowerCase() === lowerEmail)) {
      throw new Error("El usuario ya existe")
    }

    // Determinar si es el primer usuario (admin) o usar el rol proporcionado
    const isFirst = users.length === 0
    const role = providedRole || (isFirst ? UserRole.ADMIN : UserRole.MEMBER)

    // Crear nuevo usuario
    const now = Date.now()
    const newUser = {
      email: lowerEmail,
      password, // En producción, esto debería ser un hash
      role,
      createdAt: now,
      ip,
      phone,
      banned: false,
    }

    // Guardar usuario localmente
    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))

    // También registrar el usuario en el servidor
    fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: lowerEmail,
        password,
        role,
      }),
    }).catch((error) => {
      console.error("Error registrando usuario en el servidor:", error)
    })

    // Devolver respuesta sin contraseña
    const userResponse: UserResponse = {
      email: lowerEmail,
      role,
      createdAt: now,
      ip,
      phone,
      banned: false,
    }

    return userResponse
  } catch (error) {
    console.error("Error creando usuario:", error)
    throw error
  }
}

// Verificar credenciales
export function verifyCredentials(email: string, password: string): UserResponse | null {
  try {
    const lowerEmail = email.toLowerCase()

    // Obtener usuarios de localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]")

    // Buscar usuario
    const user = users.find((u: any) => u.email.toLowerCase() === lowerEmail)

    if (!user) {
      return null
    }

    // Verificar si el usuario está baneado
    if (user.banned) {
      throw new Error(`Usuario baneado. Razón: ${user.banReason || "No especificada"}`)
    }

    // Comparar contraseña
    if (user.password !== password) {
      return null
    }

    // Devolver usuario sin contraseña
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as UserResponse
  } catch (error) {
    console.error("Error verificando credenciales:", error)
    throw error
  }
}

// Obtener todos los usuarios
export function getAllUsers(): UserResponse[] {
  try {
    // Primero intentar obtener usuarios del localStorage
    const localUsers = JSON.parse(localStorage.getItem("users") || "[]")

    // También intentar obtener usuarios del servidor (asíncrono)
    fetch("/api/users/all")
      .then((response) => response.json())
      .then((serverUsers) => {
        // Combinar usuarios locales y del servidor, eliminando duplicados
        const combinedUsers = [...localUsers]

        // Añadir usuarios del servidor que no estén en localStorage
        serverUsers.forEach((serverUser: any) => {
          const exists = combinedUsers.some(
            (localUser: any) => localUser.email.toLowerCase() === serverUser.email.toLowerCase(),
          )

          if (!exists) {
            // Añadir usuario del servidor a la lista local
            combinedUsers.push({
              ...serverUser,
              password: "server-managed", // Placeholder para mantener la estructura
            })
          }
        })

        // Actualizar localStorage con la lista combinada
        localStorage.setItem("users", JSON.stringify(combinedUsers))
      })
      .catch((error) => {
        console.error("Error obteniendo usuarios del servidor:", error)
      })

    // Devolver usuarios sin contraseña
    return localUsers.map((user: any) => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword as UserResponse
    })
  } catch (error) {
    console.error("Error obteniendo usuarios:", error)
    return []
  }
}

// Obtener un usuario por email
export function getUserByEmail(email: string): UserResponse | null {
  try {
    const lowerEmail = email.toLowerCase()
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const user = users.find((u: any) => u.email.toLowerCase() === lowerEmail)

    if (!user) {
      return null
    }

    const { password, ...userWithoutPassword } = user
    return userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error obteniendo usuario ${email}:`, error)
    return null
  }
}

// Actualizar rol de usuario
export function updateUserRole(email: string, newRole: UserRole): UserResponse | null {
  try {
    const lowerEmail = email.toLowerCase()
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === lowerEmail)

    if (userIndex === -1) {
      throw new Error("Usuario no encontrado")
    }

    // Actualizar rol
    users[userIndex].role = newRole
    localStorage.setItem("users", JSON.stringify(users))

    // Devolver usuario actualizado sin contraseña
    const { password, ...userWithoutPassword } = users[userIndex]
    return userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error actualizando rol de usuario ${email}:`, error)
    throw error
  }
}

// Resetear contraseña de usuario
export function resetUserPassword(email: string, newPassword: string): UserResponse | null {
  try {
    const lowerEmail = email.toLowerCase()
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === lowerEmail)

    if (userIndex === -1) {
      throw new Error("Usuario no encontrado")
    }

    // Actualizar contraseña
    users[userIndex].password = newPassword
    localStorage.setItem("users", JSON.stringify(users))

    // Devolver usuario actualizado sin contraseña
    const { password, ...userWithoutPassword } = users[userIndex]
    return userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error reseteando contraseña de usuario ${email}:`, error)
    throw error
  }
}

// Banear/desbanear usuario
export function toggleUserBan(email: string, banned: boolean, reason?: string): UserResponse | null {
  try {
    const lowerEmail = email.toLowerCase()
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === lowerEmail)

    if (userIndex === -1) {
      throw new Error("Usuario no encontrado")
    }

    // Actualizar estado de ban
    users[userIndex].banned = banned
    if (banned && reason) {
      users[userIndex].banReason = reason
    } else if (!banned) {
      delete users[userIndex].banReason
    }

    localStorage.setItem("users", JSON.stringify(users))

    // Devolver usuario actualizado sin contraseña
    const { password, ...userWithoutPassword } = users[userIndex]
    return userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error actualizando estado de ban de usuario ${email}:`, error)
    throw error
  }
}

// Actualizar perfil de usuario
export function updateUserProfile(
  email: string,
  profileData: {
    email?: string
    phone?: string
  },
): UserResponse | null {
  try {
    const lowerEmail = email.toLowerCase()
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === lowerEmail)

    if (userIndex === -1) {
      throw new Error("Usuario no encontrado")
    }

    // Actualizar datos del perfil
    if (profileData.email) {
      const newEmail = profileData.email.toLowerCase()

      // Verificar si el nuevo email ya existe (si es diferente al actual)
      if (newEmail !== lowerEmail && users.some((u: any) => u.email.toLowerCase() === newEmail)) {
        throw new Error("El correo electrónico ya está en uso")
      }

      users[userIndex].email = newEmail
    }

    if (profileData.phone !== undefined) {
      users[userIndex].phone = profileData.phone
    }

    localStorage.setItem("users", JSON.stringify(users))

    // Si el usuario actual cambió su email, actualizar también en localStorage
    const currentUser = JSON.parse(localStorage.getItem("auth-user") || "{}")
    if (currentUser && currentUser.email === lowerEmail && profileData.email) {
      currentUser.email = profileData.email.toLowerCase()
      localStorage.setItem("auth-user", JSON.stringify(currentUser))
    }

    // Devolver usuario actualizado sin contraseña
    const { password, ...userWithoutPassword } = users[userIndex]
    return userWithoutPassword as UserResponse
  } catch (error) {
    console.error(`Error actualizando perfil de usuario ${email}:`, error)
    throw error
  }
}
