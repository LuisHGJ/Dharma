"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Plus, Trash2, Check, GripVertical } from "lucide-react"
import { checklistsApi, Checklist as ChecklistType, ChecklistItem } from "@/lib/api"
import ConfirmModal from "./ConfirmModal"

interface ChecklistProps {
  checklist: ChecklistType
  onUpdated: (deletedId?: string) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: any
}

export default function Checklist({ checklist, onUpdated, dragHandleProps }: ChecklistProps) {
  const [newItemText, setNewItemText] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [items, setItems] = useState<ChecklistItem[]>(checklist.items)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemText.trim()) return
    const created = await checklistsApi.createItem(checklist.id, { text: newItemText.trim() })
    setItems([...items, created])
    setNewItemText("")
    onUpdated()
  }

  const handleToggle = async (item: ChecklistItem) => {
    await checklistsApi.updateItem(item.id, { is_checked: !item.is_checked })
    setItems(items.map((i) => (i.id === item.id ? { ...i, is_checked: !i.is_checked } : i)))
  }

  const handleDeleteItem = async (itemId: string) => {
    await checklistsApi.deleteItem(itemId)
    setItems(items.filter((i) => i.id !== itemId))
    onUpdated()
  }

  const handleRenameItem = async (item: ChecklistItem) => {
    if (!editingText.trim() || editingText === item.text) {
      setEditingItemId(null)
      return
    }
    await checklistsApi.updateItem(item.id, { text: editingText.trim() })
    setItems(items.map((i) => (i.id === item.id ? { ...i, text: editingText.trim() } : i)))
    setEditingItemId(null)
    onUpdated()
  }

  const handleDelete = async () => {
    await checklistsApi.delete(checklist.id)
    onUpdated(checklist.id)
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return
    if (source.index === destination.index) return

    const reordered = Array.from(items)
    const [moved] = reordered.splice(source.index, 1)
    reordered.splice(destination.index, 0, moved)
    setItems(reordered)
    await checklistsApi.reorderItems(reordered.map((i) => i.id))
  }

  const total = items.length
  const checked = items.filter((i) => i.is_checked).length
  const percent = total > 0 ? (checked / total) * 100 : 0

  return (
    <>
      <div className="checklist">
        <div className="checklist-header" {...dragHandleProps}>
          <GripVertical size={14} className="checklist-drag-icon" />
          <span className="checklist-name">{checklist.name}</span>
          <span className="checklist-count">{checked}/{total}</span>
          <button className="btn-icon" onClick={() => setShowConfirm(true)}>
            <Trash2 size={14} />
          </button>
        </div>

        <div className="checklist-progress">
          <div className="checklist-progress-bar" style={{ width: `${percent}%` }} />
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`checklist-${checklist.id}`}>
            {(provided) => (
              <div className="checklist-items" ref={provided.innerRef} {...provided.droppableProps}>
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        className="checklist-item"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <span className="checklist-drag-handle" {...provided.dragHandleProps}>
                          <GripVertical size={12} />
                        </span>
                        <button
                          className={`checklist-checkbox ${item.is_checked ? "checked" : ""}`}
                          onClick={() => handleToggle(item)}
                        >
                          {item.is_checked && <Check size={12} />}
                        </button>
                        {editingItemId === item.id ? (
                          <input
                            className="checklist-item-input"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={() => handleRenameItem(item)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameItem(item)
                              if (e.key === "Escape") setEditingItemId(null)
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            className={`checklist-item-text ${item.is_checked ? "checked" : ""}`}
                            onClick={() => { setEditingItemId(item.id); setEditingText(item.text) }}
                          >
                            {item.text}
                          </span>
                        )}
                        <button className="btn-icon" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <form className="checklist-add" onSubmit={handleAddItem}>
          <input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Adicionar item..."
          />
          <button type="submit" className="btn-icon">
            <Plus size={16} />
          </button>
        </form>
      </div>
      {showConfirm && (
        <ConfirmModal
          title="Deletar checklist"
          message={`Tem certeza que deseja deletar a checklist "${checklist.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
