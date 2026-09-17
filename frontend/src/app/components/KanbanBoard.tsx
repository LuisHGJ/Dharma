"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd"
import { MoreHorizontal } from "lucide-react"
import { columnsApi, cardsApi, Column as ColumnType, Card as CardType } from "@/lib/api"
import Column from "./Column"
import CardModal from "./CardModal"
import CreateColumn from "./CreateColumn"
import ConfirmModal from "./ConfirmModal"

export default function KanbanBoard() {
  const [columns, setColumns] = useState<ColumnType[]>([])
  const [cards, setCards] = useState<CardType[]>([])
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [cardToDelete, setCardToDelete] = useState<CardType | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [wallpaper, setWallpaper] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    const [cols, cds] = await Promise.all([
      columnsApi.list(),
      cardsApi.list(),
    ])
    setColumns(cols)
    setCards(cds)
  }, [])

  useEffect(() => {
    fetchData()
    const saved = localStorage.getItem("kanban-wallpaper")
    if (saved) setWallpaper(saved)
  }, [fetchData])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setWallpaper(result)
      localStorage.setItem("kanban-wallpaper", result)
    }
    reader.readAsDataURL(file)
    setMenuOpen(false)
  }

  const handleRemoveWallpaper = () => {
    setWallpaper(null)
    localStorage.removeItem("kanban-wallpaper")
    setMenuOpen(false)
  }

  const getCardsForColumn = (columnId: string) =>
    cards.filter((c) => c.column_id === columnId).sort((a, b) => a.position - b.position)

  const handleCardClick = (card: CardType) => {
    const fullCard = cards.find((c) => c.id === card.id) || card
    setSelectedCard(fullCard)
  }

  const handleCardDeleteFromContext = (card: CardType) => {
    setCardToDelete(card)
  }

  const handleConfirmDeleteCard = async () => {
    if (!cardToDelete) return
    await cardsApi.delete(cardToDelete.id)
    setCardToDelete(null)
    fetchData()
  }

  const handleCardUpdated = async () => {
    await fetchData()
    if (selectedCard) {
      const updated = (await cardsApi.list()).find((c) => c.id === selectedCard.id)
      if (updated) setSelectedCard(updated)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    if (type === "COLUMN") {
      const reordered = Array.from(columns)
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)
      setColumns(reordered)
      await columnsApi.reorder(reordered.map((c) => c.id))
      return
    }

    const sourceColumnId = source.droppableId
    const destColumnId = destination.droppableId

    const sourceCards = getCardsForColumn(sourceColumnId)
    const destCards = sourceColumnId === destColumnId ? sourceCards : getCardsForColumn(destColumnId)

    const [movedCard] = sourceCards.splice(source.index, 1)
    destCards.splice(destination.index, 0, movedCard)

    const newCards = cards.map((c) => {
      if (c.id === movedCard.id) {
        return { ...c, column_id: destColumnId }
      }
      return c
    })
    setCards(newCards)

    await cardsApi.move(movedCard.id, { column_id: destColumnId, position: destination.index })

    for (let i = 0; i < destCards.length; i++) {
      if (destCards[i].position !== i) {
        await cardsApi.update(destCards[i].id, { position: i })
      }
    }
  }

  return (
    <div
      className="kanban"
      style={wallpaper ? { backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      <header className="kanban-header">
        <h1>Kanban</h1>
        <div className="kanban-header-menu" ref={menuRef}>
          <button className="btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              <button onClick={() => fileInputRef.current?.click()}>
                Trocar wallpaper
              </button>
              {wallpaper && (
                <button onClick={handleRemoveWallpaper} className="btn-danger-text">
                  Remover wallpaper
                </button>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleWallpaperUpload}
          />
        </div>
      </header>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div className="kanban-board" ref={provided.innerRef} {...provided.droppableProps}>
              {columns.map((col, index) => (
                <Column
                  key={col.id}
                  column={col}
                  cards={getCardsForColumn(col.id)}
                  onRefresh={fetchData}
                  onCardClick={handleCardClick}
                  onCardDelete={handleCardDeleteFromContext}
                  index={index}
                />
              ))}
              {provided.placeholder}
              <CreateColumn onCreated={fetchData} />
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdated={handleCardUpdated}
          onDeleted={() => { setSelectedCard(null); fetchData() }}
        />
      )}
      {cardToDelete && (
        <ConfirmModal
          title="Deletar card"
          message="Tem certeza que deseja deletar este card?"
          onConfirm={handleConfirmDeleteCard}
          onCancel={() => setCardToDelete(null)}
        />
      )}
    </div>
  )
}
