"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-context"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoginModal } from "@/components/login-modal"
import { formatNumber } from "@/lib/utils"

interface RateData {
  bcv: number
  brlSell: number
  brlBuy: number
  percentage: number
  date: string
  time: string
  updatedBy?: string
}

export function RatesDisplay() {
  const router = useRouter()
  const { user, logout } = useAuth()

  // Estados
  const [rates, setRates] = useState<RateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customRate, setCustomRate] = useState<string>("0")
  const [selectedOperation, setSelectedOperation] = useState<"buy" | "sell">("buy")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isAdminOrAgent, setIsAdminOrAgent] = useState(false)

  // Formatear número con precisión exacta
  const formatExactNumber = useCallback((value: number, decimals = 2): string => {
    const valueStr = value.toString()

    if (valueStr.includes(".")) {
      const [intPart, decPart] = valueStr.split(".")
      if (decPart.length < decimals) {
        return `${intPart},${decPart.padEnd(decimals, "0")}`
      }
      if (decPart.length > decimals) {
        return `${intPart},${decPart.substring(0, decimals)}`
      }
      return `${intPart},${decPart}`
    }

    return `${valueStr},${"0".repeat(decimals)}`
  }, [])

  // Cargar tasas al iniciar
  useEffect(() => {
    fetchRates()

    // Añadir listener para el evento operationChange
    const handleOperationChange = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail && customEvent.detail.operation) {
        setSelectedOperation(customEvent.detail.operation === "buy" ? "buy" : "sell")
      }
    }

    window.addEventListener("operationChange", handleOperationChange)
    return () => {
      window.removeEventListener("operationChange", handleOperationChange)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setIsAdminOrAgent(user.role === "administrador" || user.role === "agente")
    } else {
      setIsAdminOrAgent(false)
    }
  }, [user])

  // Cargar tasas desde el servidor
  const fetchRates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/tasas", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      setRates(data)
    } catch (error) {
      console.error("Error fetching rates:", error)
      setError("Error al cargar las tasas")
    } finally {
      setLoading(false)
    }
  }

  // Manejar cambio en tasa personalizada
  const handleCustomRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (/^(\d*\.?\d*)$/.test(value) || value === "") {
      setCustomRate(value)

      const event = new CustomEvent("customRateChange", {
        detail: { customRate: value || "0" },
      })
      window.dispatchEvent(event)
    }
  }

  // Manejar clic en botón de configuración
  const handleSettingsClick = () => {
    if (user) {
      if (user.role === "administrador" || user.role === "agente") {
        router.push("/actualizar-tasas")
      } else {
        setError("No tienes permisos para modificar las tasas")
        setTimeout(() => setError(null), 3000)
      }
    } else {
      setShowLoginModal(true)
    }
  }

  // Manejar éxito de login
  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    if (user && (user.role === "administrador" || user.role === "agente")) {
      router.push("/actualizar-tasas")
    }
  }

  const renderLoginModal = () => {
    return showLoginModal ? (
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
    ) : null
  }

  // Mostrar cargando
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
        <p className="text-white text-center">{error}</p>
        <div className="flex justify-center mt-4">
          <Button onClick={fetchRates}>Reintentar</Button>
        </div>
      </div>
    )
  }

  // Si no hay tasas
  if (!rates) {
    return (
      <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
        <p className="text-white text-center">No se pudieron cargar las tasas</p>
        <div className="flex justify-center mt-4">
          <Button onClick={fetchRates}>Reintentar</Button>
        </div>
      </div>
    )
  }

  // Verificar si todas las tasas son cero
  const allRatesZero = rates.bcv === 0 && rates.brlBuy === 0 && rates.brlSell === 0

  if (allRatesZero) {
    return (
      <>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">No hay tasas configuradas</div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-56">
                {isAdminOrAgent && (
                  <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
                    Actualizar Tasas
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem onClick={logout} className="text-red-400 cursor-pointer">
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-center">
          <p className="text-white mb-4">No hay tasas configuradas. Por favor, configure las tasas.</p>
          <Button onClick={handleSettingsClick}>Configurar Tasas</Button>
        </div>

        {renderLoginModal()}
      </>
    )
  }

  // Agregar este useEffect después de los otros useEffect

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <span className="font-bold text-red-300">
            Última actualización: {rates.date} {rates.time}
          </span>
        </div>

        {/* Botón de configuración */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-56">
              {isAdminOrAgent && (
                <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
                  Actualizar Tasas
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={logout} className="text-red-400 cursor-pointer">
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className={`grid grid-cols-2 max-w-md mx-auto gap-4 mt-4`}>
        <div className="bg-gray-900 rounded-lg p-3 flex flex-col items-center">
          <div className="h-10 w-10 relative mb-2">
            <Image src="/images/bcv-logo.png" alt="BCV" fill className="object-contain rounded-full" />
          </div>
          <div className="text-sm text-center font-bold text-yellow-400">Dólar BCV</div>
          <div className="text-lg font-bold flex items-center text-white">{formatNumber(rates.bcv)} Bs</div>
          <div className="text-xs text-gray-500 text-center mt-1">(Solo referencial)</div>
        </div>

        <div className="bg-gray-900 rounded-lg p-3 flex flex-col items-center">
          <div className="h-10 w-10 relative mb-2">
            <Image src="/images/bs-custom-logo.png" alt="BS" fill className="object-contain rounded-full" />
          </div>
          <div className="text-sm text-center font-bold text-yellow-400">Tasa BS Propia</div>
          <Input
            type="text"
            value={customRate}
            onChange={handleCustomRateChange}
            className="w-full bg-gray-800 border-gray-700 text-center text-lg font-bold mt-1 px-2 py-1"
            placeholder="Ingrese tasa"
          />
          <div className="text-xs text-gray-500 text-center mt-1">(Personalizada)</div>
        </div>
      </div>

      {/* Sección de tarifa */}
      <div className="mt-4 border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
        <div className="bg-gray-800 p-2 text-center border-b border-gray-700">
          <div className="text-yellow-400 font-bold text-lg uppercase">TARIFA</div>
        </div>
        <div className="grid grid-cols-2">
          <div
            className={`p-3 text-center border-r border-gray-700 ${
              selectedOperation === "buy" ? "bg-green-900/30" : ""
            }`}
          >
            <div className="text-sm text-gray-400 mb-1">Compra</div>
            <div className={`font-bold ${selectedOperation === "buy" ? "text-green-400" : "text-white"}`}>
              1 BRL = {formatExactNumber(rates.brlBuy, 2)} Bs
            </div>
          </div>
          <div className={`p-3 text-center ${selectedOperation === "sell" ? "bg-red-900/30" : ""}`}>
            <div className="text-sm text-gray-400 mb-1">Venta</div>
            <div className={`font-bold ${selectedOperation === "sell" ? "text-red-400" : "text-white"}`}>
              1 BRL = {formatExactNumber(rates.brlSell, 2)} Bs
            </div>
          </div>
        </div>
      </div>

      {renderLoginModal()}
    </>
  )
}
