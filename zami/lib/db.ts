import { neon } from "@neondatabase/serverless"
import { Pool } from "pg"

// Inicialización diferida: compilar no necesita secretos ni acceso a producción.
let localPool: Pool | undefined

export async function queryRows(query: string, params: any[] = []): Promise<any[]> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL no configurada")
  const url = new URL(connectionString)
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    localPool ??= new Pool({ connectionString, max: 5 })
    return (await localPool.query(query, params)).rows
  }
  return await neon(connectionString)(query, params)
}

// Los valores interpolados siempre se envían como parámetros, nunca como SQL.
export async function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
  const query = strings.reduce((text, part, index) => text + (index ? `$${index}` : "") + part, "")
  return queryRows(query, values)
}

// Función para verificar la conexión a la base de datos
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as test`
    console.log("Conexión a Neon establecida correctamente", result)
    return true
  } catch (error) {
    console.error("Error al conectar con Neon:", error)
    return false
  }
}
