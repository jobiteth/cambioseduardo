"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Key } from "lucide-react"
import Image from "next/image"
import { useSiteConfig } from "@/components/site-config-provider"
import { useAuth } from "@/components/auth-context"

export function AccessKeyModal() {
  const { config } = useSiteConfig()
  const { user } = useAuth() // Obtener el usuario actual
  const [isOpen, setIsOpen] = useState(false)
  const [accessKey, setAccessKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [accessData, setAccessData] = useState<{ hasAccess: boolean; requiresPassword: boolean } | null>(null)

  // Verificar si se requiere clave de acceso
  useEffect(() => {
    const checkAccess = async () => {
      try {
        setChecking(true)
        const response = await fetch("/api/site-access/verify", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Error al verificar acceso")
        }

        const data = await response.json()
        setAccessData(data)

        // Si se requiere contraseña y no tiene acceso, mostrar el modal
        // Pero solo si el usuario no está autenticado
        if (data.requiresPassword && !data.hasAccess && !user) {
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setChecking(false)
      }
    }

    checkAccess()
  }, [user]) // Añadir user como dependencia para que se vuelva a verificar cuando cambie

  // Verificar la clave de acceso
  const verifyAccessKey = async () => {
    try {
      setLoading(true)
      setError("")

      // Validar que la clave sea de 5 dígitos
      if (!/^\d{5}$/.test(accessKey)) {
        setError("La clave debe ser de 5 dígitos numéricos")
        return
      }

      const response = await fetch("/api/site-access/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessKey }),
      })

      if (!response.ok) {
        throw new Error("Error al verificar clave de acceso")
      }

      const data = await response.json()

      if (data.valid) {
        setAccessData({ requiresPassword: accessData?.requiresPassword ?? false, hasAccess: true })
        setIsOpen(false)
      } else {
        setError(data.error || "Clave de acceso incorrecta")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al verificar clave de acceso")
    } finally {
      setLoading(false)
    }
  }

  // Si está verificando el acceso, no mostrar nada
  if (checking) {
    return null
  }

  // Si el usuario está autenticado, no mostrar el modal
  if (user) {
    return null
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Solo permitir cerrar si ya tiene acceso
        if (!open && accessData && !accessData.hasAccess) {
          return // No permitir cerrar el diálogo
        }
        setIsOpen(open)
      }}
    >
      <DialogContent className="bg-slate-900 border-slate-800 text-white" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex flex-col items-center gap-3">
            <div className="relative h-16 w-16">
              <Image src={config.logo || "/images/logo.png"} alt={config.site_title} fill className="object-contain" />
            </div>
            <span>Acceso Protegido</span>
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Ingresa la clave de acceso para continuar a {config.site_title}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-900 border-red-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span>Clave de Acceso (5 dígitos)</span>
              </Label>
              <Input
                id="access-key"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value.replace(/[^0-9]/g, ""))}
                className="bg-slate-800 border-slate-700 text-center text-xl font-mono"
                placeholder="12345"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    verifyAccessKey()
                  }
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={verifyAccessKey} disabled={loading} className="w-full">
            {loading ? "Verificando..." : "Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
