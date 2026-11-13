"use client"

import { useState } from "react"
import { Draggable, Droppable } from "@hello-pangea/dnd"
import { Trash2, Pencil } from "lucide-react"
import { Column as ColumnType, Card as CardType, columnsApi } from "@/lib/api"
import Card from "./Card"
import CreateCard from "./CreateCard"
import ConfirmModal from "./ConfirmModal"

interface ColumnProps {
  column: ColumnType
  cards: CardType[]
  onRefresh: () => void
  onCardClick: (card: CardType) => void
  onCardDuplicate: (card: CardType) => void
  onCardDelete: (card: CardType) => void
  index: number
}

export default function Column({ column, cards, onRefresh, onCardClick, onCardDuplicate, onCardDelete, index }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(column.name)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRename = async () => {
    if (name.trim() && name !== column.name) {
      await columnsApi.update(column.id, { name: name.trim() })
      onRefresh()
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await columnsApi.delete(column.id)
    onRefresh()
  }

  return (
    <>
      <Draggable draggableId={column.id} index={index}>
        {(provided, snapshot) => (
          <div
            className={`column ${snapshot.isDragging ? "dragging" : ""}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
          >
            <div className="column-header" {...provided.dragHandleProps}>
              <img src="/dharma.webp" alt="" className="column-icon" />
              {isEditing ? (
                <input
                  className="column-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  autoFocus
                />
              ) : (
                <h2 className="column-name">{column.name}</h2>
              )}
              <div className="column-actions">
                <button className="btn-icon" onClick={() => setIsEditing(true)}>
                  <Pencil size={14} />
                </button>
                <button className="btn-icon btn-danger" onClick={() => setShowConfirm(true)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <span className="column-count">{cards.length}</span>
            </div>
            <Droppable droppableId={column.id} type="CARD">
              {(provided, snapshot) => (
                <div
                  className={`column-cards ${snapshot.isDraggingOver ? "dragging-over" : ""}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {cards.map((card, index) => (
                    <Card
                      key={card.id}
                      card={card}
                      onClick={() => onCardClick(card)}
                      onDuplicate={() => onCardDuplicate(card)}
                      onDelete={() => onCardDelete(card)}
                      index={index}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <CreateCard columnId={column.id} onCreated={onRefresh} />
          </div>
        )}
      </Draggable>
      {showConfirm && (
        <ConfirmModal
          title="Deletar coluna"
          message={`Tem certeza que deseja deletar a coluna "${column.name}"? Todos os cards serão removidos.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
