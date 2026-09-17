"use client"

import { Draggable, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd"
import { Card as CardType } from "@/lib/api"
import { Calendar } from "lucide-react"
import { createPortal } from "react-dom"

interface CardProps {
  card: CardType
  onClick: () => void
  onDelete: () => void
  index: number
}

function getDeadlineStatus(deadline: string | null): "white" | "green" | "red" | null {
  if (!deadline) return null
  const now = new Date()
  const dl = new Date(deadline)
  if (dl > now) return "white"
  return "red"
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function CardContent({ provided, snapshot, card, onClick, onDelete }: {
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
  card: CardType
  onClick: () => void
  onDelete: () => void
}) {
  const deadlineColor = getDeadlineStatus(card.deadline)
  const checkedCount = card.checklists.reduce(
    (acc, cl) => acc + cl.items.filter((i) => i.is_checked).length, 0
  )
  const totalCount = card.checklists.reduce(
    (acc, cl) => acc + cl.items.length, 0
  )

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete()
  }

  const element = (
    <div
      className={`card ${snapshot.isDragging ? "dragging" : ""}`}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onClick}
      onContextMenu={handleContextMenu}
    >
      {card.labels.length > 0 && (
        <div className="card-labels">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className={`card-label-chip ${label.color === "FFFFFF" ? "label-white" : ""}`}
              style={{ backgroundColor: `#${label.color}` }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      {card.cover_url && (
        <div className="card-cover">
          <img src={`http://localhost:8000${card.cover_url}`} alt="" />
        </div>
      )}
      <div className="card-body">
        <span className="card-title">{card.title}</span>
        <div className="card-meta">
          {card.deadline && (
            <span className={`card-deadline deadline-${deadlineColor}`}>
              <Calendar size={12} />
              {formatDate(card.deadline)}
            </span>
          )}
          {totalCount > 0 && (
            <span className="card-checklist-count">
              ☑ {checkedCount}/{totalCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (snapshot.isDragging) {
    return createPortal(element, document.body)
  }

  return element
}

export default function Card({ card, onClick, onDelete, index }: CardProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <CardContent
          provided={provided}
          snapshot={snapshot}
          card={card}
          onClick={onClick}
          onDelete={onDelete}
        />
      )}
    </Draggable>
  )
}
