import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simplified middleware that doesn't try to verify JWT on the edge
export async function middleware(request: NextRequest) {
  // Rutas protegidas que requieren autenticación
  const protectedPaths = ["/admin", "/actualizar-tasas"]

  // Verificar si la ruta actual está protegida
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    // Obtener token de la cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      // Redirigir a login si no hay token
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // No verificamos el token en el middleware para evitar problemas con JWT en el edge
    // La verificación se realizará en las rutas protegidas
    return NextResponse.next()
  }

  // Para rutas no protegidas, continuar normalmente
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/actualizar-tasas/:path*"],
}
