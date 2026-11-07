"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RateData {
  bcv: number
  parallel: number
  average: number
  date: string
  bcvBuy: number
  bcvSell: number
  parallelBuy: number
  parallelSell: number
  averageBuy: number
  averageSell: number
  brlBuy: number
  brlSell: number
  timestamp?: number
  hideParallelAndAverage?: boolean
  updatedBy?: string
  updatedAt?: string
}

interface AdminPanelProps {
  rates: RateData
  onUpdate: (rates: RateData) => Promise<boolean>
  onClose: () => void
}

export function AdminPanel({ rates, onUpdate, onClose }: AdminPanelProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<RateData>({
    ...rates,
    date: rates.date || new Date().toLocaleDateString("es-VE"),
    timestamp: rates.timestamp || Date.now(),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Valores de los campos como strings para evitar formateo automático
  const [bcvValue, setBcvValue] = useState(rates.bcv.toString())
  const [brlSellValue, setBrlSellValue] = useState(rates.brlSell.toString())
  const [brlBuyValue, setBrlBuyValue] = useState(rates.brlBuy.toString())

  // Calcular el porcentaje inicial basado en las tasas actuales
  const initialPercentage = (() => {
    if (rates.brlSell > 0 && rates.brlBuy > 0) {
      const sellRate = rates.brlSell
      const buyRate = rates.brlBuy
      const calculatedPercentage = ((buyRate - sellRate) / sellRate) * 100
      return calculatedPercentage.toFixed(2)
    }
    return "10" // Valor predeterminado si no se puede calcular
  })()

  const [percentage, setPercentage] = useState(initialPercentage)

  // Calcular el valor de compra basado en el valor de venta y el porcentaje
  useEffect(() => {
    try {
      const sellRate = Number.parseFloat(brlSellValue) || 0
      const percentageValue = Number.parseFloat(percentage) || 0
      const buyRate = sellRate + (sellRate * percentageValue) / 100

      // Actualizar el valor de compra como string con solo 2 decimales en lugar de 4
      setBrlBuyValue(buyRate.toFixed(2))

      // Actualizar también el formData
      setFormData((prev) => ({
        ...prev,
        brlSell: sellRate,
        brlBuy: buyRate,
        bcv: Number.parseFloat(bcvValue) || 0,
      }))
    } catch (error) {
      console.error("Error al calcular tasa de compra:", error)
    }
  }, [brlSellValue, percentage, bcvValue])

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Solo permitir números y punto decimal
    if (!/^[0-9]*\.?[0-9]*$/.test(value) && value !== "") {
      return
    }

    switch (name) {
      case "bcv":
        setBcvValue(value)
        break
      case "brlSell":
        setBrlSellValue(value)
        break
      case "brlBuy":
        setBrlBuyValue(value)
        break
      case "percentage":
        setPercentage(value)
        break
    }
  }

  // Modificar la función handleSubmit para usar solo la base de datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Convertir todos los valores de string a número, manteniendo la precisión exacta
      const bcv = Number.parseFloat(bcvValue)
      const brlSell = Number.parseFloat(brlSellValue)
      const brlBuy = Number.parseFloat(brlBuyValue)
      const percentageValue = Number.parseFloat(percentage)

      // Validar que los valores sean números válidos
      if (isNaN(bcv) || isNaN(brlSell) || isNaN(brlBuy)) {
        throw new Error("Todos los valores deben ser números válidos")
      }

      if (bcv <= 0 || brlSell <= 0 || brlBuy <= 0) {
        throw new Error("Todos los valores deben ser mayores que cero")
      }

      // Preparar datos para enviar, usando los valores exactos sin redondeo
      const updatedRates = {
        bcv,
        brlSell,
        brlBuy,
        percentage: percentageValue,
        // Estos valores se establecerán en el servidor
        parallel: 0,
        average: 0,
        date: new Date().toLocaleDateString("es-VE"),
        bcvBuy: bcv * 0.99, // Aproximación
        bcvSell: bcv * 1.01, // Aproximación
        parallelBuy: 0,
        parallelSell: 0,
        averageBuy: 0,
        averageSell: 0,
        timestamp: Date.now(),
        hideParallelAndAverage: true,
        updatedBy: user?.email,
      }

      try {
        const success = await onUpdate(updatedRates)
        if (success) {
          onClose()
        } else {
          setError("Error al actualizar las tasas. Por favor, intente de nuevo.")
        }
      } catch (updateError) {
        console.error("Error en onUpdate:", updateError)
        setError(
          `Error al actualizar las tasas: ${updateError instanceof Error ? updateError.message : "Error desconocido"}`,
        )
      }
    } catch (error) {
      console.error("Error al actualizar tasas:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4 bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Configuración de Tasas</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bcv">Dólar BCV</Label>
            <Input
              id="bcv"
              name="bcv"
              type="text"
              value={bcvValue}
              onChange={handleTextInputChange}
              className="bg-gray-800 border-gray-700"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brlSell">BRL Venta</Label>
              <Input
                id="brlSell"
                name="brlSell"
                type="text"
                value={brlSellValue}
                onChange={handleTextInputChange}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentaje %</Label>
              <Input
                id="percentage"
                name="percentage"
                type="text"
                value={percentage}
                onChange={handleTextInputChange}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brlBuy">BRL Compra</Label>
              <Input
                id="brlBuy"
                name="brlBuy"
                type="text"
                value={brlBuyValue}
                onChange={handleTextInputChange}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
