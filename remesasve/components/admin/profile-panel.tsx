"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { errorMessage } from "@/lib/error-message"
import { useAuth } from "@/components/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Key, Phone, Shield } from "lucide-react"
import { updateUserProfile, updateUserPassword } from "@/lib/actions/profile-actions"

export default function ProfilePanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("info")

  // Estados para formularios
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Estados para UI
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  // Manejar actualización de perfil
  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError("")
    setSuccess("")

    try {
      const result = await updateUserProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      })

      if (result.success) {
        setSuccess("Perfil actualizado correctamente")

        // Si el email cambió, podría ser necesario actualizar la sesión
        if (user && profileData.email !== user.email) {
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      } else {
        setError(result.error || "Error al actualizar el perfil")
      }
    } catch (error) {
      setError(errorMessage(error) || "Error al actualizar el perfil")
    } finally {
      setIsUpdating(false)
    }
  }

  // Manejar cambio de contraseña
  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError("")
    setSuccess("")

    // Validar que las contraseñas coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsUpdating(false)
      return
    }

    // Validar longitud de contraseña
    if (passwordData.newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsUpdating(false)
      return
    }

    try {
      const result = await updateUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (result.success) {
        setSuccess("Contraseña actualizada correctamente")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setError(result.error || "Error al actualizar la contraseña")
      }
    } catch (error) {
      setError(errorMessage(error) || "Error al actualizar la contraseña")
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Card className="bg-slate-800 border-slate-700 text-white">
      <CardHeader className="border-b border-slate-700">
        <CardTitle>Información de la cuenta</CardTitle>
        <CardDescription className="text-slate-400">Administra tu información personal y contraseña</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900 border-red-800">
            <AlertDescription className="text-white">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-900 border-green-800">
            <AlertDescription className="text-white">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-700 border-slate-600 mb-6">
            <TabsTrigger
              value="info"
              className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
            >
              <User className="h-4 w-4 mr-2" />
              Información Personal
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
            >
              <Key className="h-4 w-4 mr-2" />
              Contraseña
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>Teléfono</span>
                  </div>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+58 123 456 7890"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isUpdating ? "Actualizando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-slate-300">
                  Contraseña Actual
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-300">
                  Nueva Contraseña
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-300">
                  Confirmar Contraseña
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isUpdating ? "Actualizando..." : "Cambiar Contraseña"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t border-slate-700 flex flex-col items-start pt-6">
        <div className="flex items-center text-slate-400 mb-2">
          <Shield className="h-4 w-4 mr-2" />
          <span className="text-sm">Información de la cuenta</span>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full text-sm">
          <div className="text-slate-400">Rol:</div>
          <div className="text-white">
            {user.role === "administrador" ? "Administrador" : user.role === "agente" ? "Agente" : "Miembro"}
          </div>

          <div className="text-slate-400">Fecha de registro:</div>
          <div className="text-white">
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "No disponible"}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
