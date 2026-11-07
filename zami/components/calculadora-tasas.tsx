"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DollarSign } from "lucide-react"
import { formatNumber } from "@/lib/utils"

export default function CalculadoraTasas() {
  // Tasas de referencia
  const [tasaBCV, setTasaBCV] = useState(70.0)
  const [tasaPropia, setTasaPropia] = useState(0)

  // Tasas personalizadas
  const [tasaCompra, setTasaCompra] = useState(19.21)
  const [tasaVenta, setTasaVenta] = useState(17.0)

  // Operación actual (vender o comprar)
  const [operacion, setOperacion] = useState("vender")

  // Monto y moneda
  const [monto, setMonto] = useState(1)

  // Resultados calculados
  const [resultadoBs, setResultadoBs] = useState(17.0)
  const [resultadoDolar, setResultadoDolar] = useState(0.24)

  // Escuchar cambios en la tasa personalizada desde sessionStorage
  useEffect(() => {
    const handleCustomRateChange = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail && customEvent.detail.customRate) {
        setTasaPropia(Number.parseFloat(customEvent.detail.customRate) || 0)
      }
    }

    // También cargar al inicio
    const savedRate = sessionStorage.getItem("customRate")
    if (savedRate) {
      setTasaPropia(Number.parseFloat(savedRate) || 0)
    }

    window.addEventListener("customRateChange", handleCustomRateChange)
    return () => {
      window.removeEventListener("customRateChange", handleCustomRateChange)
    }
  }, [])

  // Calcular resultados cuando cambian los inputs
  const calcularResultados = () => {
    const tasaActual = operacion === "vender" ? tasaVenta : tasaCompra
    const resultadoBsCalculado = monto * tasaActual
    const resultadoDolarCalculado = resultadoBsCalculado / tasaBCV

    setResultadoBs(resultadoBsCalculado)
    setResultadoDolar(resultadoDolarCalculado)
  }

  // Actualizar cálculos cuando cambia cualquier valor relevante
  useEffect(() => {
    calcularResultados()
  }, [monto, operacion, tasaCompra, tasaVenta, tasaBCV])

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoMonto = Number.parseFloat(e.target.value) || 0
    setMonto(nuevoMonto)
  }

  const handleOperacionChange = (value: string) => {
    setOperacion(value)
  }

  return (
    <div className="w-full space-y-4">
      {/* Operación */}
      <RadioGroup value={operacion} onValueChange={handleOperacionChange} className="flex justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="vender" id="vender" />
          <Label htmlFor="vender">Vender</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="comprar" id="comprar" />
          <Label htmlFor="comprar">Comprar</Label>
        </div>
      </RadioGroup>

      {/* Monto */}
      <div className="space-y-2">
        <Label htmlFor="monto">Monto</Label>
        <div className="flex">
          <div className="bg-slate-800 flex items-center px-3 rounded-l-md border-r border-slate-700">
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-xs">🇧🇷</span>
              </div>
              <span>BRL</span>
            </div>
          </div>
          <Input
            id="monto"
            type="number"
            value={monto}
            onChange={handleMontoChange}
            className="rounded-l-none bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>

      {/* Flecha */}
      <div className="flex justify-center">
        <div className="w-8 h-8 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Resultados */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="p-4 flex items-center">
          <div className="bg-indigo-900 rounded-full p-2 mr-3">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs">Bolivares</div>
            <div className="font-bold text-xl">{formatNumber(resultadoBs, 2)} Bs</div>
          </div>
          <div className="text-xs">Dólares</div>
          <div className="font-bold">{formatNumber(resultadoDolar, 2)} $</div>
        </CardContent>
      </Card>

      {/* Tasa BS Propia */}
      {tasaPropia > 0 && (
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-900 rounded-full p-2 mr-3 flex items-center justify-center">
              <span className="font-bold text-sm">BS</span>
            </div>
            <div className="flex-1">
              <div className="text-xs">Bolivares</div>
              <div className="font-bold text-xl">{formatNumber(monto * tasaPropia, 2)} Bs</div>
            </div>
            <div className="text-xs">Dólares</div>
            <div className="font-bold">{formatNumber((monto * tasaPropia) / tasaBCV, 2)} $</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
