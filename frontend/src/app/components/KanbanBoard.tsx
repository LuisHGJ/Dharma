"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd"
import { MoreHorizontal } from "lucide-react"
import { columnsApi, cardsApi, checklistsApi, labelsApi, settingsApi, Column as ColumnType, Card as CardType } from "@/lib/api"
import Column from "./Column"
import CardModal from "./CardModal"
import CreateColumn from "./CreateColumn"
import ConfirmModal from "./ConfirmModal"
import { AppLoader, AppLoadError } from "./AppStatus"

export default function KanbanBoard() {
  const [columns, setColumns] = useState<ColumnType[]>([])
  const [cards, setCards] = useState<CardType[]>([])
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [cardToDelete, setCardToDelete] = useState<CardType | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [wallpaper, setWallpaper] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const hasLoadedRef = useRef(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const [cols, cds] = await Promise.all([
        columnsApi.list(),
        cardsApi.list(),
      ])
      setColumns(cols)
      setCards(cds)
      hasLoadedRef.current = true
      setLoadError(false)
    } catch {
      // só mostra a tela de erro se ainda não carregou nada
      if (!hasLoadedRef.current) setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRetry = () => {
    setLoadError(false)
    setLoading(true)
    fetchData()
  }

  useEffect(() => {
    fetchData()
    settingsApi.get("kanban-wallpaper").then((res) => {
      if (res.value) setWallpaper(res.value)
    }).catch(() => {})
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
    reader.onload = async (ev) => {
      const result = ev.target?.result as string
      setWallpaper(result)
      await settingsApi.set("kanban-wallpaper", result)
    }
    reader.readAsDataURL(file)
    setMenuOpen(false)
  }

  const handleRemoveWallpaper = async () => {
    setWallpaper(null)
    await settingsApi.set("kanban-wallpaper", "")
    setMenuOpen(false)
  }

  const getCardsForColumn = (columnId: string) =>
    cards.filter((c) => c.column_id === columnId).sort((a, b) => a.position - b.position)

  const handleCardClick = (card: CardType) => {
    const fullCard = cards.find((c) => c.id === card.id) || card
    setSelectedCard(fullCard)
  }

  const handleCardDuplicate = async (card: CardType) => {
    const newCard = await cardsApi.create({
      column_id: card.column_id,
      title: `${card.title} (cópia)`,
      description: card.description || undefined,
      deadline: card.deadline || undefined,
    })

    for (const cl of card.checklists) {
      const newChecklist = await checklistsApi.create(newCard.id, { name: cl.name })
      for (const item of cl.items) {
        await checklistsApi.createItem(newChecklist.id, { text: item.text })
        if (item.is_checked) {
          const createdItems = await checklistsApi.list(newCard.id)
          const created = createdItems
            .find(c => c.id === newChecklist.id)
            ?.items.find(i => i.text === item.text)
          if (created) {
            await checklistsApi.updateItem(created.id, { is_checked: true })
          }
        }
      }
    }

    for (const label of card.labels) {
      await labelsApi.create(newCard.id, { name: label.name, color: label.color })
    }

    await fetchData()
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

  if (loading || loadError) {
    return (
      <div className="kanban">
        {loading ? <AppLoader /> : <AppLoadError onRetry={handleRetry} />}
      </div>
    )
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
                  onCardDuplicate={handleCardDuplicate}
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
