"use client"

import { useState, useEffect } from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Función para verificar el tamaño de la pantalla
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // Consideramos móvil si es menor a 768px
    }

    // Verificar al cargar
    checkMobile()

    // Agregar listener para cambios de tamaño
    window.addEventListener("resize", checkMobile)

    // Limpiar listener al desmontar
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}
