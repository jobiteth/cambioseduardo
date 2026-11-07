import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-context"
import { SiteConfigProvider } from "@/components/site-config-provider"
// Importar el componente AccessKeyModal
import { AccessKeyModal } from "@/components/access-key-modal"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Remesas Venezuela Z&E",
  description: "Calculadora de tasas de Remesas Venezuela Z&E",
  generator: "contact@jhon.codes",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <style>{`
          :root {
            --site-background-color: #020617; /* slate-950 por defecto */
          }
          body {
            background-color: var(--site-background-color);
          }
        `}</style>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <SiteConfigProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
              {children}
              <AccessKeyModal />
            </ThemeProvider>
          </SiteConfigProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
