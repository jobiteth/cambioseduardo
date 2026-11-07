"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { useAuth } from "@/components/auth-context"
import { Upload, LinkIcon, ImageIcon, Palette } from "lucide-react"

export function SiteSettings() {
  const { user } = useAuth()
  // Cambiar el título predeterminado en el estado inicial
  const [siteTitle, setSiteTitle] = useState("Remesas Venezuela Z&E")
  const [logoUrl, setLogoUrl] = useState("/images/logo.png")
  const [customLogoUrl, setCustomLogoUrl] = useState("")
  const [activeTab, setActiveTab] = useState("default")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [backgroundColor, setBackgroundColor] = useState("#020617") // Valor predeterminado slate-950
  const [logoTab, setLogoTab] = useState("default")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)

  // Cargar configuración guardada
  useEffect(() => {
    try {
      const savedTitle = localStorage.getItem("site-title")
      const savedLogo = localStorage.getItem("site-logo")
      const savedBgColor = localStorage.getItem("site-bg-color")

      if (savedTitle) {
        setSiteTitle(savedTitle)
      }

      if (savedLogo) {
        setLogoUrl(savedLogo)
        // Determinar si es un logo personalizado o el predeterminado
        if (savedLogo !== "/images/logo.png") {
          setCustomLogoUrl(savedLogo)
          setLogoTab("custom")
        }
      }

      if (savedBgColor) {
        setBackgroundColor(savedBgColor)
      }
    } catch (error) {
      console.error("Error loading site settings:", error)
    }
  }, [])

  // Manejar la carga de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedImage(file)

      // Crear una URL para previsualizar la imagen
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveSettings = () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      // Validar título
      if (!siteTitle.trim()) {
        setError("El título del sitio no puede estar vacío")
        setLoading(false)
        return
      }

      // Validar URL del logo si está en la pestaña personalizada
      if (logoTab === "url" && !customLogoUrl.trim()) {
        setError("La URL del logo no puede estar vacía")
        setLoading(false)
        return
      }

      // Determinar la URL del logo según la pestaña activa
      let finalLogoUrl = "/images/logo.png" // Valor predeterminado

      if (logoTab === "url") {
        finalLogoUrl = customLogoUrl
      } else if (logoTab === "upload" && uploadPreview) {
        finalLogoUrl = uploadPreview
      }

      // Guardar en localStorage
      localStorage.setItem("site-title", siteTitle)
      localStorage.setItem("site-logo", finalLogoUrl)
      localStorage.setItem("site-bg-color", backgroundColor)

      // Actualizar estado
      setLogoUrl(finalLogoUrl)

      // Mostrar mensaje de éxito
      setSuccess("Configuración guardada correctamente")

      // Disparar evento para notificar a otros componentes
      const event = new CustomEvent("siteSettingsChanged", {
        detail: {
          title: siteTitle,
          logo: finalLogoUrl,
          backgroundColor: backgroundColor,
        },
      })
      window.dispatchEvent(event)

      // Aplicar el color de fondo inmediatamente
      document.documentElement.style.setProperty("--site-background-color", backgroundColor)

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError("Error al guardar la configuración")
      console.error("Error saving site settings:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-800">
          <AlertDescription className="text-white">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-900 border-green-800">
          <AlertDescription className="text-white">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Configuración del Sitio</CardTitle>
          <CardDescription className="text-gray-400">Personaliza el título y logo de tu sitio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="site-title">Título del Sitio</Label>
              <Input
                id="site-title"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="bg-slate-700 border-slate-600"
                placeholder="Remesas Venezuela B&V"
              />
            </div>

            <div className="space-y-4">
              <Label>Logo del Sitio</Label>

              <Tabs value={logoTab} onValueChange={setLogoTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="default" className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>Predeterminado</span>
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <span>URL</span>
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-1">
                    <Upload className="h-4 w-4" />
                    <span>Subir</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="default" className="space-y-4">
                  <div className="flex justify-center p-4 bg-black rounded-lg">
                    <div className="relative h-32 w-32">
                      <Image src="/images/logo.png" alt="Logo predeterminado" fill className="object-contain" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 text-center">Logo predeterminado de Remesas Venezuela B&V</p>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-logo">URL del Logo Personalizado</Label>
                    <Input
                      id="custom-logo"
                      value={customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      className="bg-slate-700 border-slate-600"
                      placeholder="https://ejemplo.com/mi-logo.png"
                    />
                    <p className="text-xs text-gray-400">
                      Ingresa la URL de tu logo personalizado. Recomendamos usar una imagen cuadrada de al menos 200x200
                      píxeles.
                    </p>
                  </div>

                  {customLogoUrl && (
                    <div className="flex justify-center p-4 bg-black rounded-lg">
                      <div className="relative h-32 w-32">
                        <Image
                          src={customLogoUrl || "/placeholder.svg"}
                          alt="Logo personalizado"
                          fill
                          className="object-contain"
                          onError={() => {
                            setError("Error al cargar la imagen. Verifica que la URL sea correcta.")
                          }}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upload-logo">Subir Logo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="upload-logo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Sube una imagen para usar como logo. Recomendamos usar una imagen cuadrada de al menos 200x200
                      píxeles.
                    </p>
                  </div>

                  {uploadPreview && (
                    <div className="flex justify-center p-4 bg-black rounded-lg">
                      <div className="relative h-32 w-32">
                        <Image
                          src={uploadPreview || "/placeholder.svg"}
                          alt="Logo subido"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-color" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span>Color de Fondo del Sitio</span>
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="background-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-10 p-1 bg-slate-700 border-slate-600"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                  placeholder="#020617"
                />
              </div>
              <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor }}>
                <p className="text-sm text-center text-white">Vista previa del color de fondo</p>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                {loading ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
