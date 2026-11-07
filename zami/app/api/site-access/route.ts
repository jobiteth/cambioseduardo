import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { getSession } from "@/lib/auth-service"
import { randomInt } from "crypto"

// Clave secreta para verificar tokens JWT
const JWT_SECRET = process.env.NEXTAUTH_SECRET || ""

// GET: Obtener la clave de acceso actual
export async function GET(request: Request) {
  try {
    // Verificar autenticación para administradores y agentes
    const token = (await cookies()).get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar y decodificar el token
    let decoded
    try {
      decoded = verify(token, JWT_SECRET) as { email: string; role: string }
    } catch (error) {
      console.error("Error al verificar token:", error)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Verificar rol (permitir administrador y agente)
    const session = await getSession()
    if (!session || !["administrador", "agente"].includes(session.role)) {
      return NextResponse.json({ error: "No tiene permisos para esta acción" }, { status: 403 })
    }

    // Obtener la clave de acceso
    const result = await sql`
      SELECT access_key, updated_at FROM site_access_key WHERE id = 1
    `

    // Si no existe, crear una clave por defecto
    if (!result || result.length === 0) {
      const defaultKey = generateAccessKey()
      await sql`
        INSERT INTO site_access_key (id, access_key) VALUES (1, ${defaultKey})
      `
      return NextResponse.json({ accessKey: defaultKey, updatedAt: new Date() })
    }

    return NextResponse.json({
      accessKey: result[0].access_key,
      updatedAt: result[0].updated_at,
    })
  } catch (error) {
    console.error("Error al obtener clave de acceso:", error)
    return NextResponse.json({ error: "Error al obtener clave de acceso" }, { status: 500 })
  }
}

// POST: Generar y actualizar la clave de acceso
export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const token = (await cookies()).get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar y decodificar el token
    let decoded
    try {
      decoded = verify(token, JWT_SECRET) as { email: string; role: string }
    } catch (error) {
      console.error("Error al verificar token:", error)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Verificar rol (permitir administrador y agente)
    const session = await getSession()
    if (!session || !["administrador", "agente"].includes(session.role)) {
      return NextResponse.json({ error: "No tiene permisos para esta acción" }, { status: 403 })
    }

    // Generar nueva clave de acceso
    const newKey = generateAccessKey()

    // Verificar si ya existe una clave
    const existingKey = await sql`
      SELECT id FROM site_access_key WHERE id = 1
    `

    if (existingKey && existingKey.length > 0) {
      // Actualizar clave existente
      await sql`
        UPDATE site_access_key 
        SET access_key = ${newKey}, updated_at = NOW() 
        WHERE id = 1
      `
    } else {
      // Crear nueva clave
      await sql`
        INSERT INTO site_access_key (id, access_key) VALUES (1, ${newKey})
      `
    }

    // Obtener la fecha de actualización
    const result = await sql`
      SELECT updated_at FROM site_access_key WHERE id = 1
    `

    return NextResponse.json({
      accessKey: newKey,
      updatedAt: result[0].updated_at,
    })
  } catch (error) {
    console.error("Error al actualizar clave de acceso:", error)
    return NextResponse.json({ error: "Error al actualizar clave de acceso" }, { status: 500 })
  }
}

// PUT: Actualizar la clave de acceso con un valor específico
export async function PUT(request: Request) {
  try {
    // Verificar autenticación
    const token = (await cookies()).get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar y decodificar el token
    let decoded
    try {
      decoded = verify(token, JWT_SECRET) as { email: string; role: string }
    } catch (error) {
      console.error("Error al verificar token:", error)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Verificar rol (permitir administrador y agente)
    const session = await getSession()
    if (!session || !["administrador", "agente"].includes(session.role)) {
      return NextResponse.json({ error: "No tiene permisos para esta acción" }, { status: 403 })
    }

    // Obtener la nueva clave del cuerpo de la solicitud
    const { accessKey } = await request.json()

    // Validar la clave
    if (!accessKey || accessKey.length !== 5 || !/^\d+$/.test(accessKey)) {
      return NextResponse.json({ error: "La clave debe ser de 5 dígitos numéricos" }, { status: 400 })
    }

    // Verificar si ya existe una clave
    const existingKey = await sql`
      SELECT id FROM site_access_key WHERE id = 1
    `

    if (existingKey && existingKey.length > 0) {
      // Actualizar clave existente
      await sql`
        UPDATE site_access_key 
        SET access_key = ${accessKey}, updated_at = NOW() 
        WHERE id = 1
      `
    } else {
      // Crear nueva clave
      await sql`
        INSERT INTO site_access_key (id, access_key) VALUES (1, ${accessKey})
      `
    }

    // Obtener la fecha de actualización
    const result = await sql`
      SELECT updated_at FROM site_access_key WHERE id = 1
    `

    return NextResponse.json({
      accessKey: accessKey,
      updatedAt: result[0].updated_at,
    })
  } catch (error) {
    console.error("Error al actualizar clave de acceso:", error)
    return NextResponse.json({ error: "Error al actualizar clave de acceso" }, { status: 500 })
  }
}

// Función para generar una clave de acceso de 5 dígitos
function generateAccessKey(): string {
  return randomInt(10000, 100000).toString()
}
