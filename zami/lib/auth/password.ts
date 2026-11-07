import { createHash } from "crypto"

// Función para hashear contraseñas
export async function hash(password: string): Promise<string> {
  // Usar la misma función de hash que se usa en el módulo de registro
  // Esto es un ejemplo simple, ajústalo según tu implementación actual
  return createHash("sha256").update(password).digest("hex")
}

// Función para verificar contraseñas
export async function verify(password: string, hashedPassword: string): Promise<boolean> {
  const passwordHash = await hash(password)
  return passwordHash === hashedPassword
}
