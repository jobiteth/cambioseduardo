import { getRateHistory } from "@/lib/rates-api"

export const dynamic = "force-dynamic"
export async function GET() { return getRateHistory() }
