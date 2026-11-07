"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-context"
import { Upload, LinkIcon, ImageIcon, Palette, Globe, Lock } from "lucide-react"
import Image from "next/image"

// Importar el componente AccessKeyManager
import { AccessKeyManager } from "@/components/admin/access-key-manager"

interface SiteConfig {
  site_title: string
  logo: string
  favicon: string
  background_color: string
  disable_registration: boolean
  require_password_access: boolean
}

export function SiteConfigPanel() {
  const { user } = useAuth()
  const [config, setConfig] = useState<SiteConfig>({
    site_title: "Remesas Venezuela B&V",
    logo: "/images/logo.png",
    favicon: "/favicon.ico",
    background_color: "#020617",
    disable_registration: false,
    require_password_access: false,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [logoTab, setLogoTab] = useState("default")
  const [faviconTab, setFaviconTab] = useState("default")
  const [customLogoUrl, setCustomLogoUrl] = useState("")
  const [customFaviconUrl, setCustomFaviconUrl] = useState("")
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null)
  const [uploadedFavicon, setUploadedFavicon] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)

  // Cargar configuración al iniciar
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true)
        const response = await fetch("/api/site-config")

        if (response.ok) {
          const data = await response.json()
          setConfig(data)

          // Configurar pestañas según los valores cargados
          if (data.logo !== "/images/logo.png") {
            setCustomLogoUrl(data.logo)
            setLogoTab("url")
          }

          if (data.favicon !== "/favicon.ico") {
            setCustomFaviconUrl(data.favicon)
            setFaviconTab("url")
          }
        }
      } catch (error) {
        console.error("Error cargando configuración:", error)
        setError("Error al cargar la configuración del sitio")
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Manejar cambio de archivos para logo
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedLogo(file)

      // Crear URL para previsualizar la imagen
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Manejar cambio de archivos para favicon
  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFavicon(file)

      // Crear URL para previsualizar la imagen
      const reader = new FileReader()
      reader.onload = (event) => {
        setFaviconPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Guardar configuración
  const handleSaveConfig = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      // Determinar la URL del logo según la pestaña activa
      let finalLogoUrl = "/images/logo.png" // Valor predeterminado
      if (logoTab === "url" && customLogoUrl) {
        finalLogoUrl = customLogoUrl
      } else if (logoTab === "upload" && logoPreview) {
        // En un entorno real, aquí subirías la imagen al servidor
        // y obtendrías la URL. Para este ejemplo, usamos el preview
        finalLogoUrl = logoPreview
      }

      // Determinar la URL del favicon según la pestaña activa
      let finalFaviconUrl = "/favicon.ico" // Valor predeterminado
      if (faviconTab === "url" && customFaviconUrl) {
        finalFaviconUrl = customFaviconUrl
      } else if (faviconTab === "upload" && faviconPreview) {
        // En un entorno real, aquí subirías la imagen al servidor
        finalFaviconUrl = faviconPreview
      }

      // Preparar datos para enviar
      const updatedConfig = {
        ...config,
        logo: finalLogoUrl,
        favicon: finalFaviconUrl,
      }

      // Enviar solicitud
      const response = await fetch("/api/site-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al guardar la configuración")
      }

      // Actualizar estado con la respuesta
      const data = await response.json()
      setConfig(data)

      // Mostrar mensaje de éxito
      setSuccess("Configuración guardada correctamente")

      // Aplicar cambios inmediatamente
      document.title = data.site_title
      document.documentElement.style.setProperty("--site-background-color", data.background_color)

      // Actualizar favicon
      const linkElement = document.querySelector("link[rel='icon']") as HTMLLinkElement
      if (linkElement) {
        linkElement.href = data.favicon
      }

      // Disparar evento para notificar a otros componentes
      const event = new CustomEvent("siteConfigChanged", {
        detail: data,
      })
      window.dispatchEvent(event)

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error guardando configuración:", error)
      setError(error instanceof Error ? error.message : "Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
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
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <span>Configuración General del Sitio</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Personaliza la apariencia y comportamiento de tu sitio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Título del sitio */}
          <div className="space-y-2">
            <Label htmlFor="site-title">Título del Sitio</Label>
            <Input
              id="site-title"
              value={config.site_title}
              onChange={(e) => setConfig({ ...config, site_title: e.target.value })}
              className="bg-slate-700 border-slate-600"
              placeholder="Remesas Venezuela B&V"
            />
            <p className="text-xs text-gray-400">
              Este título aparecerá en la pestaña del navegador y en la cabecera del sitio.
            </p>
          </div>

          {/* Color de fondo */}
          <div className="space-y-2">
            <Label htmlFor="background-color" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>Color de Fondo del Sitio</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="background-color"
                type="color"
                value={config.background_color}
                onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                className="w-16 h-10 p-1 bg-slate-700 border-slate-600"
              />
              <Input
                type="text"
                value={config.background_color}
                onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                className="bg-slate-700 border-slate-600"
                placeholder="#020617"
              />
            </div>
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: config.background_color }}>
              <p className="text-sm text-center text-white">Vista previa del color de fondo</p>
            </div>
          </div>

          {/* Logo del sitio */}
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
                      onChange={handleLogoFileChange}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Sube una imagen para usar como logo. Recomendamos usar una imagen cuadrada de al menos 200x200
                    píxeles.
                  </p>
                </div>

                {logoPreview && (
                  <div className="flex justify-center p-4 bg-black rounded-lg">
                    <div className="relative h-32 w-32">
                      <Image
                        src={logoPreview || "/placeholder.svg"}
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

          {/* Favicon del sitio */}
          <div className="space-y-4">
            <Label>Favicon del Sitio</Label>
            <Tabs value={faviconTab} onValueChange={setFaviconTab} className="w-full">
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
                  <div className="relative h-16 w-16">
                    <Image src="/favicon.ico" alt="Favicon predeterminado" fill className="object-contain" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 text-center">Favicon predeterminado</p>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-favicon">URL del Favicon Personalizado</Label>
                  <Input
                    id="custom-favicon"
                    value={customFaviconUrl}
                    onChange={(e) => setCustomFaviconUrl(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                    placeholder="https://ejemplo.com/favicon.ico"
                  />
                  <p className="text-xs text-gray-400">
                    Ingresa la URL de tu favicon personalizado. Recomendamos usar un archivo .ico o .png de 32x32
                    píxeles.
                  </p>
                </div>

                {customFaviconUrl && (
                  <div className="flex justify-center p-4 bg-black rounded-lg">
                    <div className="relative h-16 w-16">
                      <Image
                        src={customFaviconUrl || "/placeholder.svg"}
                        alt="Favicon personalizado"
                        fill
                        className="object-contain"
                        onError={() => {
                          setError("Error al cargar el favicon. Verifica que la URL sea correcta.")
                        }}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-favicon">Subir Favicon</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="upload-favicon"
                      type="file"
                      accept="image/x-icon,image/png,image/jpeg"
                      onChange={handleFaviconFileChange}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Sube una imagen para usar como favicon. Recomendamos usar un archivo .ico o .png de 32x32 píxeles.
                  </p>
                </div>

                {faviconPreview && (
                  <div className="flex justify-center p-4 bg-black rounded-lg">
                    <div className="relative h-16 w-16">
                      <Image
                        src={faviconPreview || "/placeholder.svg"}
                        alt="Favicon subido"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Opciones de acceso */}
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Opciones de Acceso</span>
            </Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="disable-registration" className="text-base">
                  Deshabilitar Registro
                </Label>
                <p className="text-xs text-gray-400">
                  Si está activado, los nuevos usuarios no podrán registrarse en el sitio.
                </p>
              </div>
              <Switch
                id="disable-registration"
                checked={config.disable_registration}
                onCheckedChange={(checked) => setConfig({ ...config, disable_registration: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-password" className="text-base">
                  Requerir Contraseña para Acceso
                </Label>
                <p className="text-xs text-gray-400">
                  Si está activado, se requerirá una contraseña para acceder al sitio.
                </p>
              </div>
              <Switch
                id="require-password"
                checked={config.require_password_access}
                onCheckedChange={(checked) => setConfig({ ...config, require_password_access: checked })}
              />
            </div>
          </div>

          {/* Después de la sección de opciones de acceso, añadir: */}
          <div className="pt-6">
            <AccessKeyManager
              requirePasswordAccess={config.require_password_access}
              onTogglePasswordAccess={async (value) => {
                setConfig({ ...config, require_password_access: value })
              }}
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
              {saving ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
