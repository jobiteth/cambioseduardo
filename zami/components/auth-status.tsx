"use client"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserCircle, Users, User, Globe, Menu, LogIn, UserPlus, DollarSign } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserRole } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState } from "react"
import { LoginModal } from "@/components/login-modal"

export function AuthStatus() {
  const { user, loading, logout } = useAuth()
  const isMobile = useIsMobile()
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Función para manejar el éxito del login
  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    window.location.reload() // Recargar la página para actualizar el estado
  }

  if (loading) {
    return <div className="h-9 w-9 rounded-full bg-slate-800 animate-pulse"></div>
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {isMobile ? (
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full">
              <UserCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" className="flex items-center gap-2 px-3">
              <UserCircle className="h-5 w-5" />
              <span className="font-medium">{user.email}</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-gray-400">
                {user.role === UserRole.ADMIN ? "Administrador" : user.role === UserRole.AGENT ? "Agente" : "Miembro"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />

          {/* Enlace al panel de administración para todos los usuarios */}
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer flex items-center">
              <User className="h-4 w-4 mr-2" />
              Mi Perfil
            </Link>
          </DropdownMenuItem>

          {user.role === UserRole.ADMIN && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/admin/usuarios" className="cursor-pointer flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Administrar Usuarios
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/admin?tab=site" className="cursor-pointer flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Configurar Sitio
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {(user.role === UserRole.ADMIN || user.role === UserRole.AGENT) && (
            <DropdownMenuItem asChild>
              <Link href="/updatetasas" className="cursor-pointer flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Actualizar Tasas
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-slate-700" />
          <DropdownMenuItem className="text-red-400 cursor-pointer" onClick={() => logout()}>
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Versión para usuarios no autenticados
  if (isMobile) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-56">
            <DropdownMenuItem onClick={() => setShowLoginModal(true)} className="cursor-pointer flex items-center">
              <LogIn className="h-4 w-4 mr-2" />
              Iniciar Sesión
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/registro" className="cursor-pointer flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Registrarse
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showLoginModal && (
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
        )}
      </>
    )
  }

  // Versión para escritorio
  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowLoginModal(true)}>
          Iniciar Sesión
        </Button>
        <Link href="/registro">
          <Button size="sm">Registrarse</Button>
        </Link>
      </div>

      {showLoginModal && (
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
      )}
    </>
  )
}
