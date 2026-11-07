"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { useSiteConfig } from "@/components/site-config-provider"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/login-modal"
import { UserRole } from "@/lib/types"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// Importar el icono Key
import { DollarSign, LogOut, Settings, User, Users, Palette, Key } from "lucide-react"

export function SiteHeader() {
  const { user, logout } = useAuth()
  const { config } = useSiteConfig()
  const pathname = usePathname()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Detectar scroll para cambiar el estilo del header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Obtener las iniciales del usuario para el avatar
  const getUserInitials = () => {
    if (!user?.email) return "U"
    return user.email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Determinar si el usuario es administrador
  const isAdmin = user?.role === UserRole.ADMIN
  const isAgent = user?.role === UserRole.AGENT

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled ? "bg-slate-900/95 backdrop-blur-sm shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-8 w-8 md:h-10 md:w-10">
              <Image src={config.logo || "/placeholder.svg"} alt={config.site_title} fill className="object-contain" />
            </div>
            <span className="font-bold text-sm sm:text-base md:text-xl whitespace-nowrap">{config.site_title}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!user ? (
            <Button variant="outline" onClick={() => setIsLoginModalOpen(true)}>
              Iniciar Sesión
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-700 text-white text-xs">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.role === UserRole.ADMIN
                        ? "Administrador"
                        : user.role === UserRole.AGENT
                          ? "Agente"
                          : "Usuario"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Opciones para administradores */}
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Panel de Administración</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/usuarios" className="cursor-pointer flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Gestionar Usuarios</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin?tab=site-config" className="cursor-pointer flex items-center">
                        <Palette className="mr-2 h-4 w-4" />
                        <span>Configurar Sitio</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* Opciones para administradores y agentes */}
                {(isAdmin || isAgent) && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/actualizar-tasas" className="cursor-pointer flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        <span>Actualizar Tasas</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/clave-acceso" className="cursor-pointer flex items-center">
                        <Key className="mr-2 h-4 w-4" />
                        <span>Gestionar Clave de Acceso</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* Opciones para todos los usuarios */}
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-500 focus:text-red-500 flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Modal de inicio de sesión */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </header>
  )
}
