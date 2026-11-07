import { NextResponse } from "next/server"

// Herramienta antigua de recuperación sin autenticación; no habilitar en cliente.
export async function POST() {
  return NextResponse.json({ error: "Ruta de recuperación deshabilitada. Use la administración autenticada." }, { status: 410 })
}
