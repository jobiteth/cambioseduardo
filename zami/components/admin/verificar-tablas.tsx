"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"

interface TableInfo {
  table_name: string
  record_count: number
  exists: boolean
}

export function VerificarTablas() {
  const [tablas, setTablas] = useState<TableInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verificarTablas = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/verificar-tablas")

        if (!response.ok) {
          throw new Error("Error al verificar tablas")
        }

        const data = await response.json()
        setTablas(data.tablas)
      } catch (error) {
        console.error("Error:", error)
        setError("Error al verificar las tablas de la base de datos")
      } finally {
        setIsLoading(false)
      }
    }

    verificarTablas()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de las Tablas</CardTitle>
        <CardDescription>Verificación de tablas en la base de datos</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Cargando información de tablas...</div>
        ) : error ? (
          <div className="text-red-500 py-4">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabla</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Registros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tablas.map((tabla) => (
                <TableRow key={tabla.table_name}>
                  <TableCell className="font-medium">{tabla.table_name}</TableCell>
                  <TableCell>
                    {tabla.exists ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" /> Existe
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" /> No existe
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{tabla.record_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
