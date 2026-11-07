import { DebugCalculator } from "@/components/debug-calculator"

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Depurador de Calculadora</h1>
      <DebugCalculator />
    </div>
  )
}
