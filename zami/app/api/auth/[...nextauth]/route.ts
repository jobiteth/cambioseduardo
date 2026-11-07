import { NextResponse } from "next/server"

// NextAuth no forma parte del flujo actual; se usa /api/auth/login.
export async function GET() {
  return NextResponse.json({ error: "Ruta de autenticación antigua deshabilitada" }, { status: 410 })
}

export const POST = GET
