"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Clock, RefreshCw, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-context"

interface RateHistory {
  id: number
  bcv: number
  brlSell: number
  brlBuy: number
  percentage: number
  date: string
  time: string
  updatedBy: string
  updatedAt: string
}

export default function RatesPanel() {
  const { user } = useAuth()

  // Estados para los campos del formulario
  const [bcv, setBcv] = useState("")
  const [brlSell, setBrlSell] = useState("")
  const [brlBuy, setBrlBuy] = useState("")
  const [percentage, setPercentage] = useState("")

  // Estados para el manejo de la UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // Estados para el historial
  const [history, setHistory] = useState<RateHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<RateHistory | null>(null)

  // Cargar tasas actuales e historial al iniciar
  useEffect(() => {
    loadCurrentRates()
    loadRatesHistory()
  }, [])

  // Cargar tasas actuales
  const loadCurrentRates = async () => {
    try {
      setInitialLoading(true)
      const response = await fetch("/api/tasas")

      if (!response.ok) {
        throw new Error("Error al cargar tasas actuales")
      }

      const data = await response.json()

      // Establecer valores iniciales
      setBcv(data.bcv.toString())
      setBrlSell(data.brlSell.toString())
      setBrlBuy(data.brlBuy.toString())
      setPercentage(data.percentage.toString())
    } catch (error) {
      console.error("Error cargando tasas:", error)
      setError("Error al cargar tasas actuales")
    } finally {
      setInitialLoading(false)
    }
  }

  // Cargar historial de tasas
  const loadRatesHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await fetch("/api/tasas/history")

      if (!response.ok) {
        throw new Error("Error al cargar historial de tasas")
      }

      const data = await response.json()
      setHistory(data)
    } catch (error) {
      console.error("Error cargando historial:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Eliminar entrada del historial
  const deleteHistoryEntry = async (id: number) => {
    try {
      setLoading(true)

      const response = await fetch("/api/tasas/history/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error("Error al eliminar entrada del historial")
      }

      setSuccess("Entrada eliminada correctamente")

      // Recargar historial
      loadRatesHistory()

      // Cerrar diálogo
      setShowDeleteDialog(false)
      setSelectedHistoryItem(null)

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Cargar tasas desde el historial
  const loadFromHistory = (item: RateHistory) => {
    setBcv(item.bcv.toString())
    setBrlSell(item.brlSell.toString())
    setBrlBuy(item.brlBuy.toString())
    setPercentage(item.percentage.toString())

    setSuccess("Tasas cargadas desde el historial")

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      setSuccess(null)
    }, 3000)
  }

  // Calcular tasa de compra basada en tasa de venta y porcentaje
  useEffect(() => {
    if (brlSell && percentage) {
      try {
        const sellValue = Number.parseFloat(brlSell)
        const percentageValue = Number.parseFloat(percentage)

        if (!isNaN(sellValue) && !isNaN(percentageValue)) {
          const buyValue = sellValue * (1 + percentageValue / 100)
          setBrlBuy(buyValue.toFixed(2))
        }
      } catch (error) {
        console.error("Error calculando tasa de compra:", error)
      }
    }
  }, [brlSell, percentage])

  // Validar entrada numérica
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Solo permitir números y punto decimal
    if (!/^[0-9]*\.?[0-9]*$/.test(value) && value !== "") {
      return
    }

    switch (name) {
      case "bcv":
        setBcv(value)
        break
      case "brlSell":
        setBrlSell(value)
        break
      case "brlBuy":
        setBrlBuy(value)
        break
      case "percentage":
        setPercentage(value)
        break
    }
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpiar mensajes
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Validar datos
      const bcvValue = Number.parseFloat(bcv)
      const brlSellValue = Number.parseFloat(brlSell)
      const brlBuyValue = Number.parseFloat(brlBuy)
      const percentageValue = Number.parseFloat(percentage)

      if (isNaN(bcvValue) || isNaN(brlSellValue) || isNaN(brlBuyValue) || isNaN(percentageValue)) {
        throw new Error("Todos los campos deben ser números válidos")
      }

      if (bcvValue <= 0 || brlSellValue <= 0 || brlBuyValue <= 0) {
        throw new Error("Los valores deben ser mayores que cero")
      }

      // Preparar datos
      const data = {
        bcv: bcvValue,
        brlSell: brlSellValue,
        brlBuy: brlBuyValue,
        percentage: percentageValue,
      }

      // Enviar solicitud
      const response = await fetch("/api/tasas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      // Verificar respuesta
      if (!response.ok) {
        let errorMessage = "Error al guardar tasas"

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Si no se puede parsear como JSON
          console.error("Error parsing response:", e)
        }

        throw new Error(errorMessage)
      }

      // Procesar respuesta exitosa
      const responseData = await response.json()

      setSuccess("Tasas actualizadas correctamente")

      // Recargar tasas actuales e historial
      setTimeout(() => {
        loadCurrentRates()
        loadRatesHistory()
        setSuccess(null)
      }, 2000)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Abrir diálogo de confirmación para eliminar
  const openDeleteDialog = (item: RateHistory) => {
    setSelectedHistoryItem(item)
    setShowDeleteDialog(true)
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-900 border-red-800">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-900 border-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-center">Actualizar Tasas de Cambio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bcv">Dólar BCV</Label>
              <Input
                id="bcv"
                name="bcv"
                value={bcv}
                onChange={handleNumberInput}
                className="bg-slate-700 border-slate-600"
                placeholder="Ej: 70.50"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brlSell">BRL Venta (Bs)</Label>
                <Input
                  id="brlSell"
                  name="brlSell"
                  value={brlSell}
                  onChange={handleNumberInput}
                  className="bg-slate-700 border-slate-600"
                  placeholder="Ej: 17.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Porcentaje %</Label>
                <Input
                  id="percentage"
                  name="percentage"
                  value={percentage}
                  onChange={handleNumberInput}
                  className="bg-slate-700 border-slate-600"
                  placeholder="Ej: 10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brlBuy">BRL Compra (Bs)</Label>
                <Input
                  id="brlBuy"
                  name="brlBuy"
                  value={brlBuy}
                  onChange={handleNumberInput}
                  className="bg-slate-700 border-slate-600"
                  placeholder="Ej: 19.21"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Tasas"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Historial de tasas */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Historial de Tasas</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadRatesHistory} disabled={loadingHistory} className="h-8">
            <RefreshCw className={`h-4 w-4 mr-1 ${loadingHistory ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-6 text-gray-400">No hay historial disponible</div>
          ) : (
            <div className="max-h-80 overflow-y-auto border border-slate-700 rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-900">
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>BCV</TableHead>
                    <TableHead>BRL Venta</TableHead>
                    <TableHead>BRL Compra</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">
                        {item.date} {item.time}
                      </TableCell>
                      <TableCell>{item.bcv.toFixed(2)}</TableCell>
                      <TableCell>{item.brlSell.toFixed(2)}</TableCell>
                      <TableCell>{item.brlBuy.toFixed(2)}</TableCell>
                      <TableCell>{item.percentage.toFixed(2)}%</TableCell>
                      <TableCell>{item.updatedBy}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadFromHistory(item)}
                            className="h-7 px-2"
                          >
                            Cargar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(item)}
                            className="h-7 px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>

          {selectedHistoryItem && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Fecha:</div>
                <div>
                  {selectedHistoryItem.date} {selectedHistoryItem.time}
                </div>

                <div className="text-gray-400">BCV:</div>
                <div>{selectedHistoryItem.bcv.toFixed(2)}</div>

                <div className="text-gray-400">BRL Venta:</div>
                <div>{selectedHistoryItem.brlSell.toFixed(2)}</div>

                <div className="text-gray-400">BRL Compra:</div>
                <div>{selectedHistoryItem.brlBuy.toFixed(2)}</div>

                <div className="text-gray-400">Usuario:</div>
                <div>{selectedHistoryItem.updatedBy}</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedHistoryItem && deleteHistoryEntry(selectedHistoryItem.id)}
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
