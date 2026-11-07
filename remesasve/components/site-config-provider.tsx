"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface SiteConfig {
  site_title: string
  logo: string
  favicon: string
  background_color: string
  disable_registration: boolean
  require_password_access: boolean
}

interface SiteConfigContextType {
  config: SiteConfig
  loading: boolean
  error: string | null
  refreshConfig: () => Promise<void>
}

// Cambiar el título predeterminado en el objeto defaultConfig
const defaultConfig: SiteConfig = {
  site_title: "Remesas Venezuela Z&E",
  logo: "/images/logo.png",
  favicon: "/favicon.ico",
  background_color: "#020617",
  disable_registration: false,
  require_password_access: false,
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: defaultConfig,
  loading: true,
  error: null,
  refreshConfig: async () => {},
})

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/site-config")

      if (!response.ok) {
        throw new Error("Error al cargar la configuración del sitio")
      }

      const data = await response.json()
      setConfig(data)

      // Aplicar configuración
      document.title = data.site_title
      document.documentElement.style.setProperty("--site-background-color", data.background_color)

      // Actualizar favicon
      const linkElement = document.querySelector("link[rel='icon']") as HTMLLinkElement
      if (linkElement) {
        linkElement.href = data.favicon
      } else {
        // Si no existe, crear uno nuevo
        const newLink = document.createElement("link")
        newLink.rel = "icon"
        newLink.href = data.favicon
        document.head.appendChild(newLink)
      }
    } catch (error) {
      console.error("Error cargando configuración del sitio:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Cargar configuración al iniciar
  useEffect(() => {
    fetchConfig()
  }, [])

  // Escuchar eventos de cambio de configuración
  useEffect(() => {
    const handleConfigChange = () => {
      fetchConfig()
    }

    window.addEventListener("siteConfigChanged", handleConfigChange)

    return () => {
      window.removeEventListener("siteConfigChanged", handleConfigChange)
    }
  }, [])

  return (
    <SiteConfigContext.Provider value={{ config, loading, error, refreshConfig: fetchConfig }}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export function useSiteConfig() {
  return useContext(SiteConfigContext)
}
