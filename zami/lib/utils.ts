import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, decimals = 2): string {
  // Redondear a los decimales especificados (en lugar de truncar)
  const factor = Math.pow(10, decimals)
  const rounded = Math.round(value * factor) / factor

  // Formatear con punto para miles y coma para decimales
  return rounded.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
