import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { createHash } from "crypto"
import { getSession } from "@/lib/auth-service"

// Función para generar un hash de la clave de acceso
function generateKeyHash(accessKey: string): string {
  return createHash("sha256").update(accessKey).digest("hex")
}

// POST: Verificar la clave de acceso
export async function POST(request: Request) {
  try {
    // Obtener la clave del cuerpo de la solicitud
    const { accessKey } = await request.json()

    if (!accessKey) {
      return NextResponse.json({ valid: false, error: "Clave de acceso requerida" }, { status: 400 })
    }

    // Obtener la clave de acceso actual
    const result = await sql`
      SELECT access_key FROM site_access_key WHERE id = 1
    `

    // Si no hay clave configurada, permitir acceso
    if (!result || result.length === 0) {
      return NextResponse.json({ valid: true })
    }

    // Verificar si la clave coincide
    const currentKey = result[0].access_key
    const isValid = currentKey === accessKey

    if (isValid) {
      // Generar un hash de la clave actual para almacenar en la cookie
      const keyHash = generateKeyHash(currentKey)

      // Establecer una cookie con el hash de la clave actual
      ;(await cookies()).set({
        name: "site-access",
        // Formato: "granted:HASH_DE_LA_CLAVE"
        value: `granted:${keyHash}`,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Sin expiración definida (persistirá hasta que se cierre el navegador o se elimine manualmente)
        sameSite: "lax",
      })

      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json({ valid: false, error: "Clave de acceso incorrecta" })
    }
  } catch (error) {
    console.error("Error al verificar clave de acceso:", error)
    return NextResponse.json({ valid: false, error: "Error al verificar clave de acceso" }, { status: 500 })
  }
}

// GET: Verificar si el usuario tiene acceso
export async function GET() {
  try {
    // Verificar si se requiere contraseña para acceder al sitio
    const configResult = await sql`
      SELECT require_password_access FROM site_config ORDER BY id DESC LIMIT 1
    `

    // Si no hay configuración o no se requiere contraseña, permitir acceso
    if (!configResult || configResult.length === 0 || !configResult[0].require_password_access) {
      return NextResponse.json({ hasAccess: true, requiresPassword: false })
    }

    // Verificar si el usuario está autenticado
    const authToken = (await cookies()).get("auth-token")?.value

    if (authToken) {
      try {
        // Verificar el token JWT
        const session = await getSession()

        // Si el usuario está autenticado, permitir acceso sin clave
        if (session) {
          return NextResponse.json({ hasAccess: true, requiresPassword: false, isAuthenticated: true })
        }
      } catch (tokenError) {
        // Si hay un error al verificar el token, ignorarlo y continuar con la verificación normal
        console.error("Error al verificar token de autenticación:", tokenError)
      }
    }

    // Si el usuario no está autenticado, verificar si existe una cookie de acceso
    const accessCookie = (await cookies()).get("site-access")?.value

    if (accessCookie) {
      // Verificar el formato de la cookie (granted:HASH)
      const [status, keyHash] = accessCookie.split(":")

      if (status === "granted" && keyHash) {
        // Obtener la clave actual para verificar si ha cambiado
        const keyResult = await sql`
          SELECT access_key FROM site_access_key WHERE id = 1
        `

        if (keyResult && keyResult.length > 0) {
          const currentKey = keyResult[0].access_key
          const currentKeyHash = generateKeyHash(currentKey)

          // Verificar si el hash almacenado coincide con el hash de la clave actual
          if (keyHash === currentKeyHash) {
            // La clave no ha cambiado, permitir acceso
            return NextResponse.json({ hasAccess: true, requiresPassword: false })
          }
          // Si el hash no coincide, la clave ha cambiado y se debe solicitar nuevamente
        }
      }
    }

    // Si se requiere contraseña, verificar si existe una clave configurada
    const keyResult = await sql`
      SELECT access_key FROM site_access_key WHERE id = 1
    `

    // Si no hay clave configurada pero se requiere contraseña, crear una por defecto
    if (!keyResult || keyResult.length === 0) {
      const defaultKey = Math.floor(10000 + Math.random() * 90000).toString()
      await sql`
        INSERT INTO site_access_key (id, access_key) VALUES (1, ${defaultKey})
      `
    }

    // No tiene acceso o la clave ha cambiado
    return NextResponse.json({ hasAccess: false, requiresPassword: true })
  } catch (error) {
    console.error("Error al verificar acceso:", error)
    return NextResponse.json({ hasAccess: false, error: "Error al verificar acceso" }, { status: 500 })
  }
}
