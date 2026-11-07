"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { UserRole } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, User, Globe, Database, DollarSign, Palette } from "lucide-react"
import { SiteSettings } from "@/components/admin/site-settings"
import { SiteConfigPanel } from "@/components/admin/site-config"
import { ResetDatabase } from "@/components/reset-database"
import dynamic from "next/dynamic"

// Importar componentes dinámicamente para evitar problemas de SSR
const ProfilePage = dynamic(() => import("@/components/admin/profile-panel"), {
  loading: () => (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  ),
})

const RatesPanel = dynamic(() => import("@/components/admin/rates-panel"), {
  loading: () => (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  ),
})

const UsersPanel = dynamic(() => import("@/components/admin/users-panel"), {
  loading: () => (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  ),
})

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("profile")

  // Obtener la pestaña de los parámetros de búsqueda
  useEffect(() => {
    const tab = searchParams?.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Redirigir si el usuario no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?callbackUrl=/admin")
    }
  }, [user, loading, router])

  // Actualizar la URL cuando cambia la pestaña
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin?tab=${value}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null // No mostrar nada mientras se redirige
  }

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel de Administración</h1>
          <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Panel de Administración</CardTitle>
              <CardDescription className="text-gray-400">
                Gestiona tu cuenta y configuraciones según tu nivel de acceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid grid-cols-6 mb-6">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </TabsTrigger>

                  {/* Mostrar pestaña de tasas solo para administradores y agentes */}
                  {(user.role === UserRole.ADMIN || user.role === UserRole.AGENT) && (
                    <TabsTrigger value="rates" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Tasas</span>
                    </TabsTrigger>
                  )}

                  {/* Mostrar pestaña de usuarios solo para administradores */}
                  {user.role === UserRole.ADMIN && (
                    <TabsTrigger value="users" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Usuarios</span>
                    </TabsTrigger>
                  )}

                  {/* Mostrar pestaña de configuración del sitio solo para administradores */}
                  {user.role === UserRole.ADMIN && (
                    <TabsTrigger value="site" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Sitio</span>
                    </TabsTrigger>
                  )}

                  {/* Nueva pestaña para configuración avanzada del sitio */}
                  {user.role === UserRole.ADMIN && (
                    <TabsTrigger value="site-config" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      <span>Config. Sitio</span>
                    </TabsTrigger>
                  )}

                  {/* Pestaña para resetear la base de datos */}
                  {user.role === UserRole.ADMIN && (
                    <TabsTrigger value="database" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>Base de Datos</span>
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="profile">
                  <ProfilePage />
                </TabsContent>

                {(user.role === UserRole.ADMIN || user.role === UserRole.AGENT) && (
                  <TabsContent value="rates">
                    <RatesPanel />
                  </TabsContent>
                )}

                {user.role === UserRole.ADMIN && (
                  <TabsContent value="users">
                    <UsersPanel />
                  </TabsContent>
                )}

                {user.role === UserRole.ADMIN && (
                  <TabsContent value="site">
                    <SiteSettings />
                  </TabsContent>
                )}

                {/* Nuevo contenido para la pestaña de configuración del sitio */}
                {user.role === UserRole.ADMIN && (
                  <TabsContent value="site-config">
                    <SiteConfigPanel />
                  </TabsContent>
                )}

                {/* Contenido para la pestaña de base de datos */}
                {user.role === UserRole.ADMIN && (
                  <TabsContent value="database">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle>Administración de Base de Datos</CardTitle>
                        <CardDescription className="text-gray-400">
                          Opciones avanzadas para la gestión de la base de datos
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-yellow-900/30 p-4 rounded-md border border-yellow-800">
                            <p className="text-white font-bold">Zona de Peligro</p>
                            <p className="text-white">
                              Las siguientes acciones son irreversibles y pueden causar pérdida de datos.
                            </p>
                          </div>

                          <ResetDatabase />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
