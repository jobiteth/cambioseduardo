"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ArrowDownIcon, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatNumber } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

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
}

type Currency = "brl" | "usd" | "bs"
type OperationType = "buy" | "sell"

interface CurrencyInfo {
  name: string
  symbol: string
  image: string
  shortName: string
}

export function SimpleCalculator() {
  const [amount, setAmount] = useState<number>(1)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("brl")
  const [rates, setRates] = useState<RateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [rateError, setRateError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [customRate, setCustomRate] = useState<string>("0")
  const [forceUpdate, setForceUpdate] = useState<number>(0)
  const [operation, setOperation] = useState<OperationType>("buy")

  // Cargar el monto y moneda del localStorage
  useEffect(() => {
    try {
      // Cargar el monto guardado
      const savedAmount = localStorage.getItem("calculatorAmount")
      if (savedAmount) {
        const parsedAmount = Number.parseFloat(savedAmount)
        if (!isNaN(parsedAmount)) {
          setAmount(parsedAmount)
        }
      }

      // Cargar la moneda seleccionada
      const savedCurrency = localStorage.getItem("calculatorCurrency")
      if (savedCurrency && (savedCurrency === "brl" || savedCurrency === "usd" || savedCurrency === "bs")) {
        setSelectedCurrency(savedCurrency as Currency)
      }

      // Cargar la operación seleccionada
      const savedOperation = localStorage.getItem("calculatorOperation")
      if (savedOperation && (savedOperation === "buy" || savedOperation === "sell")) {
        setOperation(savedOperation as OperationType)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }, [])

  // Guardar el monto en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem("calculatorAmount", amount.toString())
    } catch (error) {
      console.error("Error saving amount to localStorage:", error)
    }
  }, [amount])

  // Guardar la moneda seleccionada en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem("calculatorCurrency", selectedCurrency)
    } catch (error) {
      console.error("Error saving currency to localStorage:", error)
    }
  }, [selectedCurrency])

  // Guardar la operación seleccionada en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem("calculatorOperation", operation)
    } catch (error) {
      console.error("Error saving operation to localStorage:", error)
    }
  }, [operation])

  // Agregar un listener para el evento customRateChange
  useEffect(() => {
    const handleCustomRateChange = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail && typeof customEvent.detail.customRate === "string") {
        setCustomRate(customEvent.detail.customRate)
        console.log("Evento customRateChange recibido:", customEvent.detail.customRate)
        // Forzar actualización de la UI
        setForceUpdate((prev) => prev + 1)
      }
    }

    window.addEventListener("customRateChange", handleCustomRateChange)
    return () => {
      window.removeEventListener("customRateChange", handleCustomRateChange)
    }
  }, [])

  useEffect(() => {
    async function fetchRates() {
      try {
        setLoading(true)
        setRateError(null)
        const response = await fetch("/api/tasas", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          setRates(data)
        } else {
          throw new Error("No se pudieron consultar las tasas")
        }
      } catch (error) {
        console.error("Error fetching rates:", error)
        setRateError("No se pudieron consultar las tasas. Intente nuevamente.")
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
  }, [retry])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    const newAmount = isNaN(value) ? 0 : value
    setAmount(newAmount)

    // Guardar en localStorage
    try {
      localStorage.setItem("calculatorAmount", newAmount.toString())
    } catch (error) {
      console.error("Error saving amount to localStorage:", error)
    }
  }

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency)

    // Guardar en localStorage
    try {
      localStorage.setItem("calculatorCurrency", currency)
    } catch (error) {
      console.error("Error saving currency to localStorage:", error)
    }
  }

  // Modifica la función handleOperationChange para emitir un evento cuando cambie la operación
  const handleOperationChange = (value: OperationType) => {
    setOperation(value)

    // Guardar en localStorage
    try {
      localStorage.setItem("calculatorOperation", value)

      // Emitir evento para notificar a otros componentes
      const event = new CustomEvent("operationChange", {
        detail: { operation: value },
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Error saving operation to localStorage:", error)
    }
  }

  // Get currency name and symbol
  const getCurrencyInfo = (currency: Currency): CurrencyInfo => {
    switch (currency) {
      case "brl":
        return {
          name: "Reales",
          symbol: "R$",
          image: "/images/brazil-flag.png",
          shortName: "BRL",
        }
      case "usd":
        return {
          name: "Dólares",
          symbol: "$",
          image: "/images/usd-logo.png",
          shortName: "USD",
        }
      case "bs":
        return {
          name: "Bolívares",
          symbol: "Bs",
          image: "/images/venezuela-flag.png",
          shortName: "Bs",
        }
      default:
        return {
          name: "",
          symbol: "",
          image: "",
          shortName: "",
        }
    }
  }

  const currencies: Currency[] = ["brl", "usd", "bs"]

  // Calculate conversions based on selected currency
  const calculateConversions = (amount: number, fromCurrency: Currency, rateType: "bcv" | "custom") => {
    if (!rates)
      return {
        buy: { bsAmount: 0, usdAmount: 0, brlAmount: 0 },
        sell: { bsAmount: 0, usdAmount: 0, brlAmount: 0 },
      }

    // Obtener las tasas BRL para compra y venta
    const brlBuyRate = rates.brlBuy
    const brlSellRate = rates.brlSell

    // Obtener el valor de la tasa según el tipo
    let rateValue = 0
    switch (rateType) {
      case "bcv":
        rateValue = rates.bcv
        break
      case "custom":
        const customRateValue = Number.parseFloat(customRate)
        // Si es tasa personalizada y el valor es 0 o inválido, devolver todos los valores como 0
        if (isNaN(customRateValue) || customRateValue <= 0) {
          return {
            buy: { bsAmount: 0, usdAmount: 0, brlAmount: 0 },
            sell: { bsAmount: 0, usdAmount: 0, brlAmount: 0 },
          }
        }
        rateValue = customRateValue
        break
    }

    // Si la tasa es 0, devolver todos los valores como 0
    if (rateValue === 0 || brlBuyRate === 0 || brlSellRate === 0) {
      return {
        buy: { bsAmount: 0, usdAmount: 0, brlAmount: 0 },
        sell: { bsAmount: 0, usdAmount: 0, brlAmount: 0 },
      }
    }

    // Resultados para operación de compra
    let buyBsAmount = 0
    let buyUsdAmount = 0
    let buyBrlAmount = 0

    // Resultados para operación de venta
    let sellBsAmount = 0
    let sellUsdAmount = 0
    let sellBrlAmount = 0

    if (fromCurrency === "usd") {
      // Cuando el usuario tiene USD:
      buyBsAmount = amount * rateValue
      buyUsdAmount = amount
      buyBrlAmount = (amount * rateValue) / brlBuyRate

      sellBsAmount = amount * rateValue
      sellUsdAmount = amount
      sellBrlAmount = (amount * rateValue) / brlSellRate
    } else if (fromCurrency === "brl") {
      // Cuando el usuario tiene BRL:
      // Para compra: Bolívares = Monto * Tasa de compra
      buyBsAmount = amount * brlBuyRate
      // Dólares = Bolívares / Tasa BCV
      buyUsdAmount = buyBsAmount / rateValue
      buyBrlAmount = amount

      // Para venta: Bolívares = Monto * Tasa de venta
      sellBsAmount = amount * brlSellRate
      // Dólares = Bolívares / Tasa BCV
      sellUsdAmount = sellBsAmount / rateValue
      sellBrlAmount = amount
    } else if (fromCurrency === "bs") {
      // Cuando el usuario tiene Bs:
      buyUsdAmount = amount / rateValue
      buyBrlAmount = amount / brlBuyRate
      buyBsAmount = amount

      sellUsdAmount = amount / rateValue
      sellBrlAmount = amount / brlSellRate
      sellBsAmount = amount
    }

    return {
      buy: { bsAmount: buyBsAmount, usdAmount: buyUsdAmount, brlAmount: buyBrlAmount },
      sell: { bsAmount: sellBsAmount, usdAmount: sellUsdAmount, brlAmount: sellBrlAmount },
    }
  }

  // Get placeholder text based on selected currency
  const getPlaceholderText = () => {
    const currencyInfo = getCurrencyInfo(selectedCurrency)
    return `Ingrese ${currencyInfo.name}`
  }

  const currentCurrency = getCurrencyInfo(selectedCurrency)

  if (rateError) {
    return <div role="alert" className="p-4 text-center">
      <p>{rateError}</p>
      <Button onClick={() => setRetry(value => value + 1)}>Reintentar</Button>
    </div>
  }

  if (loading || !rates) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Verificar si todas las tasas son cero
  const allRatesZero = rates.bcv === 0 && rates.brlBuy === 0 && rates.brlSell === 0

  if (allRatesZero) {
    return (
      <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-center">
        <p className="text-white mb-4">
          No hay tasas configuradas. Por favor, configure las tasas para usar la calculadora.
        </p>
        <Button onClick={() => (window.location.href = "/admin")}>Ir a Configuración</Button>
      </div>
    )
  }

  // Calcular las conversiones para la tasa BCV
  const bcvConversions = calculateConversions(amount, selectedCurrency, "bcv")
  // Calcular las conversiones para la tasa BS Propia
  const customConversions = calculateConversions(amount, selectedCurrency, "custom")

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center text-2xl font-bold text-white mb-3">Monto</div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center w-full max-w-xs">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="h-14 bg-gray-900 rounded-l-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors relative group px-3 border-r border-gray-700">
                <div className="relative w-8 h-8">
                  <Image
                    src={currentCurrency.image || "/placeholder.svg?height=32&width=32"}
                    alt={selectedCurrency.toUpperCase()}
                    fill
                    className="object-contain rounded-full"
                  />
                </div>
                <div className="flex items-center text-xs text-gray-400 group-hover:text-white mt-1">
                  <span>{currentCurrency.shortName}</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-gray-800 border-gray-700">
              {currencies.map((currency) => {
                const info = getCurrencyInfo(currency)
                return (
                  <DropdownMenuItem
                    key={currency}
                    onClick={() => handleCurrencyChange(currency)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative w-5 h-5">
                        <Image
                          src={info.image || "/placeholder.svg?height=20&width=20"}
                          alt={info.shortName}
                          fill
                          className="object-contain rounded-full"
                        />
                      </div>
                      <span>
                        {info.name} ({info.shortName})
                      </span>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            type="number"
            value={amount || ""}
            onChange={handleAmountChange}
            className="bg-gray-900 border-gray-800 text-center text-2xl font-bold h-14 rounded-l-none"
            placeholder={getPlaceholderText()}
          />
        </div>
      </div>

      {/* Radio buttons para seleccionar operación */}
      <div className="flex justify-center mb-4 mt-2">
        <RadioGroup
          value={operation}
          onValueChange={(value) => handleOperationChange(value as OperationType)}
          className="flex bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
        >
          <div className={`flex items-center px-6 py-3 ${operation === "buy" ? "bg-green-600/30" : ""}`}>
            <RadioGroupItem value="buy" id="buy" className="text-green-500 border-green-500 h-6 w-6" />
            <Label htmlFor="buy" className="text-white cursor-pointer font-bold text-lg ml-3">
              COMPRAR
            </Label>
          </div>

          {/* Línea divisoria vertical */}
          <div className="w-px bg-gray-600 h-full"></div>

          <div className={`flex items-center px-6 py-3 ${operation === "sell" ? "bg-red-600/30" : ""}`}>
            <RadioGroupItem value="sell" id="sell" className="text-red-500 border-red-500 h-6 w-6" />
            <Label htmlFor="sell" className="text-white cursor-pointer font-bold text-lg ml-3">
              VENDER
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-center">
        <ArrowDownIcon className="h-6 w-6 text-gray-400" />
      </div>

      <div className="space-y-3">
        {/* BCV Section */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-3 flex items-center">
              <div className="h-6 w-6 relative mr-2">
                <Image src="/images/bcv-logo.png" alt="BCV" fill className="object-contain rounded-full" />
              </div>
              <div className="text-sm font-medium text-white">BCV</div>
            </div>
            <div
              className={`p-3 text-center text-sm font-medium ${
                operation === "buy" ? "text-green-500 bg-green-600/20" : "text-red-500 bg-red-600/20"
              } border-l border-gray-800`}
            >
              {operation === "buy" ? "COMPRA" : "VENTA"}
            </div>
          </div>

          {/* Línea horizontal */}
          <div className="h-px w-full bg-gray-800"></div>

          <div className="grid grid-cols-2">
            <div className="p-3">
              <div className="flex items-center gap-1 text-xs text-white mb-1">
                {selectedCurrency === "bs" ? (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/usd-logo.png" alt="USD" fill className="object-contain rounded-full" />
                    </div>
                    <span>Dólares</span>
                  </>
                ) : selectedCurrency === "brl" ? (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/usd-logo.png" alt="USD" fill className="object-contain rounded-full" />
                    </div>
                    <span>Dólares</span>
                  </>
                ) : (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/venezuela-flag.png" alt="Bs" fill className="object-contain rounded-full" />
                    </div>
                    <span>Bolívares</span>
                  </>
                )}
              </div>
              <div className="text-lg font-bold text-white">
                {selectedCurrency === "bs"
                  ? `${formatNumber(operation === "buy" ? bcvConversions.buy.usdAmount : bcvConversions.sell.usdAmount, 2)} $`
                  : selectedCurrency === "brl"
                    ? `${formatNumber(operation === "buy" ? bcvConversions.buy.usdAmount : bcvConversions.sell.usdAmount, 2)} $`
                    : `${formatNumber(operation === "buy" ? bcvConversions.buy.bsAmount : bcvConversions.sell.bsAmount)} Bs`}
              </div>
            </div>

            <div
              className={`p-3 border-l border-gray-800 ${operation === "buy" ? "bg-green-600/10" : "bg-red-600/10"}`}
            >
              <div className="flex items-center gap-1 text-xs text-white mb-1 justify-center">
                {selectedCurrency === "brl" ? (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/venezuela-flag.png" alt="Bs" fill className="object-contain rounded-full" />
                    </div>
                    <span>Bolívares</span>
                  </>
                ) : selectedCurrency === "usd" ? (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/brazil-flag.png" alt="BRL" fill className="object-contain rounded-full" />
                    </div>
                    <span>Reales</span>
                  </>
                ) : (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/brazil-flag.png" alt="BRL" fill className="object-contain rounded-full" />
                    </div>
                    <span>Reales</span>
                  </>
                )}
              </div>
              <div className="text-lg font-bold text-white text-center">
                {operation === "buy"
                  ? selectedCurrency === "brl"
                    ? `${formatNumber(bcvConversions.buy.bsAmount)} Bs`
                    : selectedCurrency === "usd"
                      ? `${formatNumber(bcvConversions.buy.brlAmount, 2)} R$`
                      : `${formatNumber(bcvConversions.buy.brlAmount, 2)} R$`
                  : selectedCurrency === "brl"
                    ? `${formatNumber(bcvConversions.sell.bsAmount)} Bs`
                    : selectedCurrency === "usd"
                      ? `${formatNumber(bcvConversions.sell.brlAmount, 2)} R$`
                      : `${formatNumber(bcvConversions.sell.brlAmount, 2)} R$`}
              </div>
            </div>
          </div>
        </div>

        {/* Tasa BS Propia Section */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-3 flex items-center">
              <div className="h-6 w-6 relative mr-2">
                <Image src="/images/bs-custom-logo.png" alt="BS" fill className="object-contain rounded-full" />
              </div>
              <div className="text-sm font-medium text-white">Tasa BS Propia</div>
            </div>
            <div
              className={`p-3 text-center text-sm font-medium ${
                operation === "buy" ? "text-green-500 bg-green-600/20" : "text-red-500 bg-red-600/20"
              } border-l border-gray-800`}
            >
              {operation === "buy" ? "COMPRA" : "VENTA"}
            </div>
          </div>

          {/* Línea horizontal */}
          <div className="h-px w-full bg-gray-800"></div>

          <div className="grid grid-cols-2">
            <div className="p-3">
              <div className="flex items-center gap-1 text-xs text-white mb-1">
                {selectedCurrency === "bs" ? (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/usd-logo.png" alt="USD" fill className="object-contain rounded-full" />
                    </div>
                    <span>Dólares</span>
                  </>
                ) : selectedCurrency === "brl" ? (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/usd-logo.png" alt="USD" fill className="object-contain rounded-full" />
                    </div>
                    <span>Dólares</span>
                  </>
                ) : (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/venezuela-flag.png" alt="Bs" fill className="object-contain rounded-full" />
                    </div>
                    <span>Bolívares</span>
                  </>
                )}
              </div>
              <div className="text-lg font-bold text-white">
                {selectedCurrency === "bs"
                  ? `${formatNumber(operation === "buy" ? customConversions.buy.usdAmount : customConversions.sell.usdAmount, 2)} $`
                  : selectedCurrency === "brl"
                    ? `${formatNumber(operation === "buy" ? customConversions.buy.usdAmount : customConversions.sell.usdAmount, 2)} $`
                    : `${formatNumber(operation === "buy" ? customConversions.buy.bsAmount : customConversions.sell.bsAmount)} Bs`}
              </div>
            </div>

            <div
              className={`p-3 border-l border-gray-800 ${operation === "buy" ? "bg-green-600/10" : "bg-red-600/10"}`}
            >
              <div className="flex items-center gap-1 text-xs text-white mb-1 justify-center">
                {selectedCurrency === "brl" ? (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/venezuela-flag.png" alt="Bs" fill className="object-contain rounded-full" />
                    </div>
                    <span>Bolívares</span>
                  </>
                ) : selectedCurrency === "usd" ? (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/brazil-flag.png" alt="BRL" fill className="object-contain rounded-full" />
                    </div>
                    <span>Reales</span>
                  </>
                ) : (
                  <>
                    <div className="relative w-3 h-3">
                      <Image src="/images/brazil-flag.png" alt="BRL" fill className="object-contain rounded-full" />
                    </div>
                    <span>Reales</span>
                  </>
                )}
              </div>
              <div className="text-lg font-bold text-white text-center">
                {operation === "buy"
                  ? selectedCurrency === "brl"
                    ? `${formatNumber(customConversions.buy.bsAmount)} Bs`
                    : selectedCurrency === "usd"
                      ? `${formatNumber(customConversions.buy.brlAmount, 2)} R$`
                      : `${formatNumber(customConversions.buy.brlAmount, 2)} R$`
                  : selectedCurrency === "brl"
                    ? `${formatNumber(customConversions.sell.bsAmount)} Bs`
                    : selectedCurrency === "usd"
                      ? `${formatNumber(customConversions.sell.brlAmount, 2)} R$`
                      : `${formatNumber(customConversions.sell.brlAmount, 2)} R$`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
