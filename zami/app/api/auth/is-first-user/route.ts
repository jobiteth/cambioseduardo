import { NextResponse } from "next/server"
import { isFirstUser } from "@/lib/user-service"

export async function GET() {
  try {
    const isFirst = await isFirstUser()
    return NextResponse.json({ isFirst })
  } catch (error) {
    console.error("Error verificando primer usuario:", error)
    return NextResponse.json({ error: "Error al verificar primer usuario" }, { status: 500 })
  }
}
