import Link from "next/link"
import { UserAdminPanel } from "@/components/user-admin-panel"
import { getUsers, getUserLevels } from "@/lib/db/users"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminUsuariosPage() {
  // Obtener usuarios y niveles usando la misma conexión que el registro
  const users = await getUsers()
  const userLevels = await getUserLevels()

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-end mb-6">
          <Link href="/">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
        <UserAdminPanel initialUsers={users} userLevels={userLevels} />
      </div>
    </div>
  )
}
