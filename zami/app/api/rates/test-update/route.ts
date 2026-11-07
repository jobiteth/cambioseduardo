import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ error: "Ruta de prueba deshabilitada" }, { status: 410 })
}
