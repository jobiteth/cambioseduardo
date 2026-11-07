"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, ArrowRightLeft } from "lucide-react"

export default function MigrarDatosPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
    count?: number
  } | null>(null)

  const migrarDatos = async () => {
    try {
      setIsLoading(true)
      setResult(null)

      const response = await fetch("/api/migrar-datos")
      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          count: data.count,
        })
      } else {
        setResult({
          success: false,
          error: data.error || "Error desconocido",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Error al conectar con el servidor",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Migración de Datos</CardTitle>
          <CardDescription>Migrar datos de las tablas originales a las nuevas tablas Zami</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Esta herramienta copiará los datos de la tabla <code>exchange_rates</code> a la tabla{" "}
            <code>exchangezami_rates</code> si la tabla de destino está vacía.
          </p>

          {result && (
            <Alert
              className={
                result.success
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }
            >
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Operación exitosa" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.success ? (
                  <>
                    {result.message}
                    {result.count !== undefined && (
                      <div className="mt-2">
                        Registros en la tabla: <strong>{result.count}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  result.error
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={migrarDatos} disabled={isLoading} className="w-full">
            {isLoading ? (
              "Migrando datos..."
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Migrar Datos
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
