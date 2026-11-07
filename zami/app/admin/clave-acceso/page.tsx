"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Key, Info, UserCheck } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { AccessKeyManager } from "@/components/admin/access-key-manager"

export default function AccessKeyPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [error, setError] = useState("")
  const [requirePasswordAccess, setRequirePasswordAccess] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)

  // Cargar configuración al iniciar
  useEffect(() => {
    async function loadConfig() {
      try {
        setConfigLoading(true)
        setError("") // Limpiar errores anteriores

        const response = await fetch("/api/site-config")

        if (!response.ok) {
          throw new Error("Error al cargar la configuración del sitio")
        }

        const data = await response.json()
        setRequirePasswordAccess(data.require_password_access)
      } catch (error) {
        console.error("Error cargando configuración:", error)
        setError("Error al cargar la configuración del sitio")
      } finally {
        setConfigLoading(false)
      }
    }

    if (user) {
      loadConfig()
    }
  }, [user])

  // Redirigir si el usuario no está autenticado o no tiene permisos
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?callbackUrl=/admin/clave-acceso")
    } else if (!loading && user && user.role !== "administrador" && user.role !== "agente") {
      router.push("/")
    }
  }, [user, loading, router])

  // Manejar cambio en el interruptor de requerir contraseña
  const handleTogglePasswordAccess = async (value: boolean) => {
    try {
      const response = await fetch("/api/site-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          require_password_access: value,
          // Incluir otros campos necesarios para evitar que se sobrescriban
          site_title: "Remesas Venezuela Z&E", // Valor por defecto
          logo: "/images/logo.png", // Valor por defecto
          favicon: "/favicon.ico", // Valor por defecto
          background_color: "#020617", // Valor por defecto
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Error al actualizar la configuración")
      }

      setRequirePasswordAccess(value)
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }

  if (loading || configLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user || (user.role !== "administrador" && user.role !== "agente")) {
    return null // No mostrar nada mientras se redirige
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Key className="h-5 w-5" />
            <span>Gestión de Clave de Acceso</span>
          </h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900 border-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle>Clave de Acceso al Sitio</CardTitle>
            <CardDescription className="text-gray-400">
              Gestiona la clave de acceso para proteger tu sitio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccessKeyManager
              requirePasswordAccess={requirePasswordAccess}
              onTogglePasswordAccess={handleTogglePasswordAccess}
            />
          </CardContent>
        </Card>

        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800 mt-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Info className="h-5 w-5" />
            <span>¿Cómo funciona?</span>
          </h3>
          <p className="mb-2">
            Cuando la opción &quot;Requerir Contraseña para Acceso&quot; está activada, los visitantes no autenticados deberán
            ingresar la clave de 5 dígitos para poder acceder al sitio.
          </p>
          <p className="mb-2">
            La clave se almacena de forma segura en la base de datos y puede ser cambiada en cualquier momento. Puedes
            generar una nueva clave aleatoria o establecer una personalizada.
          </p>
          <p className="mb-2">
            <strong>Importante:</strong> Una vez que un visitante ingresa la clave correctamente, se le permite el
            acceso indefinidamente hasta que la clave sea cambiada. Si cambias la clave, todos los visitantes deberán
            ingresar la nueva clave para acceder nuevamente.
          </p>
          <div className="bg-green-900/30 p-3 rounded-md border border-green-800 mt-3 flex items-start gap-2">
            <UserCheck className="h-5 w-5 text-green-400 mt-0.5" />
            <div>
              <p className="font-semibold text-green-400">Usuarios registrados</p>
              <p className="text-sm">
                Los usuarios registrados (administradores, agentes y miembros) no necesitan ingresar la clave de acceso,
                incluso cuando la protección está activada. El sistema los reconoce automáticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
