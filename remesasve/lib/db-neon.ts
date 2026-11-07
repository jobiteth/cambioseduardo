import { queryRows, sql } from "./db"

// Función para ejecutar consultas SQL directamente
export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T> {
  try {
    return (await queryRows(query, params)) as T
  } catch (error) {
    console.error("Error ejecutando consulta SQL:", error)
    throw error
  }
}

// Función para verificar la conexión a la base de datos
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    console.log("Conexión a Neon establecida correctamente")
    return true
  } catch (error) {
    console.error("Error al conectar con Neon:", error)
    return false
  }
}
