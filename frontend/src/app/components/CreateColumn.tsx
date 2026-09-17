"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { columnsApi } from "@/lib/api"

interface CreateColumnProps {
  onCreated: () => void
}

export default function CreateColumn({ onCreated }: CreateColumnProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await columnsApi.create({ name: name.trim() })
    setName("")
    setIsOpen(false)
    onCreated()
  }

  if (!isOpen) {
    return (
      <button className="create-column-btn" onClick={() => setIsOpen(true)}>
        <Plus size={20} />
        Adicionar coluna
      </button>
    )
  }

  return (
    <form className="create-column-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da coluna..."
      />
      <div className="create-column-actions">
        <button type="submit" className="btn-primary">Adicionar</button>
        <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>
          <X size={16} />
        </button>
      </div>
    </form>
  )
}
