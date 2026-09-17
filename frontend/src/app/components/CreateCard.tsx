"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { cardsApi } from "@/lib/api"

interface CreateCardProps {
  columnId: string
  onCreated: () => void
}

export default function CreateCard({ columnId, onCreated }: CreateCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await cardsApi.create({ column_id: columnId, title: title.trim() })
    setTitle("")
    setIsOpen(false)
    onCreated()
  }

  if (!isOpen) {
    return (
      <button className="create-card-btn" onClick={() => setIsOpen(true)}>
        <Plus size={16} />
        Adicionar card
      </button>
    )
  }

  return (
    <form className="create-card-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do card..."
      />
      <div className="create-card-actions">
        <button type="submit" className="btn-primary btn-sm">Adicionar</button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setIsOpen(false)}>
          <X size={14} />
        </button>
      </div>
    </form>
  )
}
