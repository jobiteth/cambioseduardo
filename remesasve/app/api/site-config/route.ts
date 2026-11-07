import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { getSession } from "@/lib/auth-service"

// Clave secreta para verificar tokens JWT
const JWT_SECRET = process.env.NEXTAUTH_SECRET || ""

// GET: Obtener la configuración actual del sitio
export async function GET() {
  try {
    // Obtener la configuración del sitio
    const config = await sql`
      SELECT * FROM site_config
      ORDER BY id DESC 
      LIMIT 1
    `

    // Si no hay configuración, devolver valores predeterminados
    if (!config || config.length === 0) {
      return NextResponse.json({
        site_title: "Remesas Venezuela Z&E",
        logo: "/images/logo.png",
        favicon: "/favicon.ico",
        background_color: "#020617",
        disable_registration: false,
        require_password_access: false,
      })
    }

    return NextResponse.json(config[0])
  } catch (error) {
    console.error("Error al obtener configuración del sitio:", error)
    return NextResponse.json({ error: "Error al obtener configuración del sitio" }, { status: 500 })
  }
}

// POST: Actualizar la configuración del sitio
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

    // Verificar rol (solo administrador puede modificar la configuración)
    if ((await getSession())?.role !== "administrador") {
      return NextResponse.json({ error: "No tiene permisos para esta acción" }, { status: 403 })
    }

    // Obtener datos de la solicitud
    const data = await request.json()
    const { site_title, logo, favicon, background_color, disable_registration, require_password_access } = data

    // Validar datos requeridos
    if (!site_title || !logo || !background_color) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar si ya existe una configuración
    const existingConfig = await sql`
      SELECT id FROM site_config LIMIT 1
    `

    let result
    if (existingConfig && existingConfig.length > 0) {
      // Actualizar configuración existente
      result = await sql`
        UPDATE site_config SET
          site_title = ${site_title},
          logo = ${logo},
          favicon = ${favicon || "/favicon.ico"},
          background_color = ${background_color},
          disable_registration = ${disable_registration || false},
          require_password_access = ${require_password_access || false},
          updated_at = NOW()
        WHERE id = ${existingConfig[0].id}
        RETURNING *
      `
    } else {
      // Crear nueva configuración
      result = await sql`
        INSERT INTO site_config (
          site_title, 
          logo, 
          favicon, 
          background_color, 
          disable_registration, 
          require_password_access
        ) VALUES (
          ${site_title}, 
          ${logo}, 
          ${favicon || "/favicon.ico"}, 
          ${background_color}, 
          ${disable_registration || false}, 
          ${require_password_access || false}
        )
        RETURNING *
      `
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error al actualizar configuración del sitio:", error)
    return NextResponse.json({ error: "Error al actualizar configuración del sitio" }, { status: 500 })
  }
}
