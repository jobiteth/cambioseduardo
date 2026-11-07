"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { RefreshCw, Key, Edit, Check, X, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface AccessKeyManagerProps {
  requirePasswordAccess: boolean
  onTogglePasswordAccess: (value: boolean) => Promise<void>
}

export function AccessKeyManager({ requirePasswordAccess, onTogglePasswordAccess }: AccessKeyManagerProps) {
  const [accessKey, setAccessKey] = useState<string>("")
  const [updatedAt, setUpdatedAt] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [customKey, setCustomKey] = useState("")
  const [toggleLoading, setToggleLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  // Cargar la clave de acceso actual
  useEffect(() => {
    fetchAccessKey()
  }, [])

  const fetchAccessKey = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/site-access", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Asegurarse de enviar las cookies
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar la clave de acceso")
      }

      const data = await response.json()
      setAccessKey(data.accessKey)
      setUpdatedAt(formatDate(data.updatedAt))
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar la clave de acceso")
    } finally {
      setLoading(false)
    }
  }

  // Generar una nueva clave de acceso
  const generateNewKey = async () => {
    try {
      setGenerating(true)
      setError("")
      setSuccess("")
      setShowWarning(true)

      const response = await fetch("/api/site-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Asegurarse de enviar las cookies
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al generar nueva clave de acceso")
      }

      const data = await response.json()
      setAccessKey(data.accessKey)
      setUpdatedAt(formatDate(data.updatedAt))
      setSuccess("Clave de acceso generada correctamente")

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)

      // Ocultar advertencia después de 10 segundos
      setTimeout(() => setShowWarning(false), 10000)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error al generar nueva clave de acceso")
    } finally {
      setGenerating(false)
    }
  }

  // Guardar clave personalizada
  const saveCustomKey = async () => {
    try {
      // Validar que la clave sea de 5 dígitos
      if (!/^\d{5}$/.test(customKey)) {
        setError("La clave debe ser de 5 dígitos numéricos")
        return
      }

      setGenerating(true)
      setError("")
      setSuccess("")
      setShowWarning(true)

      const response = await fetch("/api/site-access", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessKey: customKey }),
        credentials: "include", // Asegurarse de enviar las cookies
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar clave personalizada")
      }

      const data = await response.json()
      setAccessKey(data.accessKey)
      setUpdatedAt(formatDate(data.updatedAt))
      setSuccess("Clave de acceso actualizada correctamente")
      setIsEditing(false)

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)

      // Ocultar advertencia después de 10 segundos
      setTimeout(() => setShowWarning(false), 10000)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error al guardar clave personalizada")
    } finally {
      setGenerating(false)
    }
  }

  // Manejar cambio en el interruptor de requerir contraseña
  const handleTogglePasswordAccess = async () => {
    try {
      setToggleLoading(true)
      setError("")
      setSuccess("")

      await onTogglePasswordAccess(!requirePasswordAccess)

      setSuccess(requirePasswordAccess ? "Acceso con contraseña desactivado" : "Acceso con contraseña activado")

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error al cambiar la configuración de acceso")
    } finally {
      setToggleLoading(false)
    }
  }

  // Iniciar edición de clave personalizada
  const startEditing = () => {
    setCustomKey(accessKey)
    setIsEditing(true)
  }

  // Cancelar edición
  const cancelEditing = () => {
    setIsEditing(false)
    setError("")
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return "No disponible"

    try {
      const date = new Date(dateString)
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          <span>Clave de Acceso al Sitio</span>
        </CardTitle>
        <CardDescription className="text-gray-400">Gestiona la clave de acceso para proteger tu sitio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-900 border-red-800">
            <AlertDescription className="text-white">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-900 border-green-800">
            <AlertDescription className="text-white">{success}</AlertDescription>
          </Alert>
        )}

        {showWarning && (
          <Alert className="bg-amber-900/50 border-amber-800">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription className="text-white">
              Al cambiar la clave de acceso, todos los usuarios deberán ingresar la nueva clave para acceder al sitio.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="require-password" className="text-base">
              Requerir Contraseña para Acceso
            </Label>
            <p className="text-xs text-gray-400">
              Si está activado, se requerirá una clave de 5 dígitos para acceder al sitio
            </p>
          </div>
          <Switch
            id="require-password"
            checked={requirePasswordAccess}
            onCheckedChange={handleTogglePasswordAccess}
            disabled={toggleLoading}
          />
        </div>

        <div className="pt-4 border-t border-slate-700">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Clave de Acceso Actual</Label>
              <div className="text-xs text-gray-400">Actualizada: {updatedAt}</div>
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-center text-xl font-mono"
                  maxLength={5}
                  placeholder="12345"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveCustomKey}
                  disabled={generating}
                  className="h-10 w-10 text-green-500"
                >
                  <Check className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={cancelEditing} className="h-10 w-10 text-red-500">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-center text-xl font-mono flex-1">
                  {accessKey}
                </div>
                <Button variant="ghost" size="icon" onClick={startEditing} className="h-10 w-10">
                  <Edit className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-slate-700 pt-4">
        <Button onClick={generateNewKey} disabled={generating} className="w-full flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
          <span>{generating ? "Generando..." : "Generar Nueva Clave"}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
