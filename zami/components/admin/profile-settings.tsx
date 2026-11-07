"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRole } from "@/lib/types"
import * as clientAuth from "@/lib/client-auth"
import Link from "next/link"
import { DollarSign } from "lucide-react"

interface ProfileSettingsProps {
  user: {
    email: string
    role: UserRole
    createdAt?: number
    phone?: string
  }
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState(user.phone || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validar que el email tenga formato correcto
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError("Formato de correo electrónico inválido")
        setLoading(false)
        return
      }

      // Actualizar perfil
      const updatedUser = clientAuth.updateUserProfile(user.email, {
        email,
        phone,
      })

      if (updatedUser) {
        setSuccess("Perfil actualizado correctamente")

        // Si el email cambió, necesitamos actualizar la sesión
        if (email !== user.email) {
          // Recargar la página después de 2 segundos para reflejar los cambios
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      } else {
        setError("Error al actualizar el perfil")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al actualizar el perfil")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validar que las contraseñas coincidan
      if (newPassword !== confirmPassword) {
        setError("Las contraseñas no coinciden")
        setLoading(false)
        return
      }

      // Validar longitud de contraseña
      if (newPassword.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        setLoading(false)
        return
      }

      // Verificar contraseña actual
      const isValid = await clientAuth.verifyCredentials(user.email, currentPassword)
      if (!isValid) {
        setError("Contraseña actual incorrecta")
        setLoading(false)
        return
      }

      // Cambiar contraseña
      const updated = clientAuth.resetUserPassword(user.email, newPassword)
      if (updated) {
        setSuccess("Contraseña actualizada correctamente")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")

        // Iniciar sesión con la nueva contraseña
        await login(user.email, newPassword)
      } else {
        setError("Error al actualizar la contraseña")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al cambiar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  // Verificar si el usuario es administrador o agente
  const canManageRates = user.role === UserRole.ADMIN || user.role === UserRole.AGENT

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-800">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-900 border-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Accesos rápidos para administradores y agentes */}
      {canManageRates && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription className="text-gray-400">Accede rápidamente a funciones importantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/actualizar-tasas">
              <Button className="w-full flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Actualizar Tasas</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Información de Perfil</CardTitle>
          <CardDescription className="text-gray-400">Actualiza tu información personal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Número de Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-700 border-slate-600"
                placeholder="+58 123 456 7890"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar Perfil"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription className="text-gray-400">Actualiza tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-slate-700 border-slate-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-700 border-slate-600"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-700 border-slate-600"
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Información de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Rol:</span>
              <span className="font-medium">
                {user.role === UserRole.ADMIN ? "Administrador" : user.role === UserRole.AGENT ? "Agente" : "Miembro"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fecha de registro:</span>
              <span className="font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "No disponible"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
