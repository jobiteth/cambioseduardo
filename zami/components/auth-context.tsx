"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { UserRole } from "@/lib/types"

// Definir tipos
type User = {
  id: number
  name: string
  email: string
  role: UserRole
  createdAt?: Date
  phone?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (userData: { name: string; email: string; password: string }) => Promise<{
    success: boolean
    error?: string
  }>
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor de autenticación
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar usuario al iniciar
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)

      if (!email || !password) {
        return {
          success: false,
          error: "Email y contraseña son requeridos",
        }
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Credenciales inválidas",
        }
      }

      setUser(data.user)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error en el servidor",
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para registrar un nuevo usuario
  const register = async (userData: { name: string; email: string; password: string }) => {
    try {
      setLoading(true)

      if (!userData.name || !userData.email || !userData.password) {
        return {
          success: false,
          error: "Nombre, email y contraseña son requeridos",
        }
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Error en registro",
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error en el servidor",
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    try {
      setLoading(true)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      window.location.href = "/"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, register }}>{children}</AuthContext.Provider>
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }

  return context
}
