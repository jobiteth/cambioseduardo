// Enumeración para roles de usuario
export enum UserRole {
  ADMIN = "administrador",
  AGENT = "agente",
  MEMBER = "miembro",
}

// Interfaz para el modelo de usuario
export interface User extends Record<string, unknown> {
  email: string
  password: string // Esto será un hash, no la contraseña en texto plano
  role: UserRole
  createdAt: number
  ip?: string
  banned?: boolean
  banReason?: string
}

// Interfaz para la respuesta de usuario (sin contraseña)
export interface UserResponse {
  email: string
  role: UserRole
  createdAt: number
  ip?: string
  banned?: boolean
  banReason?: string
}
