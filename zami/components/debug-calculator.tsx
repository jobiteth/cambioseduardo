"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RateData {
  bcv: number
  brlSell: number
  brlBuy: number
  percentage: number
  date: string
  time: string
  updatedBy: string
}

export function DebugCalculator() {
  const [rates, setRates] = useState<RateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState(100)
  const [operation, setOperation] = useState<"buy" | "sell">("sell")
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    async function fetchRates() {
      try {
        setLoading(true)
        const response = await fetch("/api/tasas")
        if (response.ok) {
          const data = await response.json()
          setRates(data)
        } else {
          console.error("Error fetching rates:", response.statusText)
        }
      } catch (error) {
        console.error("Error fetching rates:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
  }, [])

  const calculateResults = () => {
    if (!rates) return

    // Obtener las tasas
    const { bcv, brlSell, brlBuy } = rates

    // Calcular para BRL
    let bsAmount = 0
    let usdAmount = 0

    if (operation === "sell") {
      // Venta de BRL
      bsAmount = amount * brlSell
      usdAmount = bsAmount / bcv
    } else {
      // Compra de BRL
      bsAmount = amount * brlBuy
      usdAmount = bsAmount / bcv
    }

    setResults({
      operation,
      amount,
      brlSell,
      brlBuy,
      bcv,
      bsAmount,
      usdAmount,
      calculationDetails: `${amount} BRL * ${operation === "sell" ? brlSell : brlBuy} = ${bsAmount} Bs / ${bcv} = ${usdAmount} USD`,
    })
  }

  if (loading) {
    return <div>Cargando tasas...</div>
  }

  if (!rates) {
    return <div>No se pudieron cargar las tasas</div>
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Depurador de Cálculos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold">Tasas actuales:</h3>
            <ul className="list-disc pl-5">
              <li>BCV: {rates.bcv}</li>
              <li>BRL Venta: {rates.brlSell}</li>
              <li>BRL Compra: {rates.brlBuy}</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant={operation === "sell" ? "default" : "outline"} onClick={() => setOperation("sell")}>
              Vender BRL
            </Button>
            <Button variant={operation === "buy" ? "default" : "outline"} onClick={() => setOperation("buy")}>
              Comprar BRL
            </Button>
          </div>

          <div>
            <label className="block mb-1">Monto (BRL):</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>

          <Button onClick={calculateResults} className="w-full">
            Calcular
          </Button>

          {results && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h3 className="font-bold">Resultados:</h3>
              <div className="text-sm space-y-1">
                <p>Operación: {results.operation === "sell" ? "Vender" : "Comprar"} BRL</p>
                <p>Monto: {results.amount} BRL</p>
                <p>Tasa utilizada: {results.operation === "sell" ? results.brlSell : results.brlBuy}</p>
                <p>Tasa BCV: {results.bcv}</p>
                <p>Bolívares: {results.bsAmount.toFixed(2)} Bs</p>
                <p>Dólares: {results.usdAmount.toFixed(2)} USD</p>
                <p className="font-mono text-xs mt-2 border-t pt-1">Cálculo: {results.calculationDetails}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
