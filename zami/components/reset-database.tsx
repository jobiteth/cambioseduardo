"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

export function ResetDatabase() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleReset = async () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const response = await fetch("/api/users/reset-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      const data = await response.json()
      setSuccess(data.message)
      setShowConfirmDialog(false)

      // Limpiar localStorage
      localStorage.removeItem("auth-user")
      localStorage.removeItem("auth-token")

      // Redirigir a la página de registro después de 3 segundos
      setTimeout(() => {
        window.location.href = "/registro"
      }, 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al resetear la base de datos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6">
      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-800 mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-900 border-green-800 mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Button variant="destructive" onClick={() => setShowConfirmDialog(true)} className="w-full">
        Resetear Base de Datos
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Reseteo de Base de Datos</DialogTitle>
            <DialogDescription className="text-gray-400">
              Esta acción eliminará TODOS los usuarios registrados. El próximo usuario que se registre será
              automáticamente administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-900/30 p-4 rounded-md border border-red-800 my-4">
            <p className="text-white font-bold">¡ADVERTENCIA!</p>
            <p className="text-white">
              Esta acción no se puede deshacer. Todos los datos de usuarios serán eliminados permanentemente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={loading}>
              {loading ? "Reseteando..." : "Confirmar Reseteo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
