import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "El borrado masivo de usuarios está deshabilitado" }, { status: 410 })
}
