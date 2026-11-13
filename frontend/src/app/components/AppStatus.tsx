"use client"

import { Loader2, WifiOff } from "lucide-react"

export function AppLoader() {
  return (
    <div className="app-status">
      <Loader2 size={32} className="app-status-spinner" />
      <p className="app-status-title">Conectando com o servidor...</p>
      <p className="app-status-text">
        Se a API estiver dormindo, pode levar até 1 minuto para ela acordar.
      </p>
    </div>
  )
}

export function AppLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="app-status">
      <WifiOff size={32} className="app-status-icon" />
      <p className="app-status-title">Não foi possível conectar com a API</p>
      <p className="app-status-text">
        Ela pode estar acordando ou fora do ar. Aguarde alguns segundos e tente novamente.
      </p>
      <button className="btn-primary" onClick={onRetry}>
        Tentar novamente
      </button>
    </div>
  )
}
