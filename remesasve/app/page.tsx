import { RatesDisplay } from "@/components/rates-display"
import { SimpleCalculator } from "@/components/simple-calculator"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <div className="min-h-screen text-white">
      <SiteHeader />

      <main className="container mx-auto py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6 text-white">Calculadora de Tasas</h1>

          <div className="space-y-6">
            <RatesDisplay />
            <SimpleCalculator />
          </div>
        </div>
      </main>
    </div>
  )
}
