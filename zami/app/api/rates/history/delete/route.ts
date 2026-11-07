import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "Ruta KV antigua deshabilitada. Use /api/tasas/history/delete con sesión." }, { status: 410 })
}
