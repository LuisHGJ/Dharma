"use client"

import { useEffect, useRef } from "react"
import { Copy, Trash2 } from "lucide-react"

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export default function ContextMenu({ x, y, onClose, onDuplicate, onDelete }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: y, left: x }}
    >
      <button className="context-menu-item" onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
        <Copy size={14} />
        Duplicar
      </button>
      <button className="context-menu-item context-menu-danger" onClick={(e) => { e.stopPropagation(); onDelete() }}>
        <Trash2 size={14} />
        Excluir
      </button>
    </div>
  )
}
