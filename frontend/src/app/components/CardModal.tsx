"use client"

import { useState, useRef } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { X, Trash2, Upload, Calendar, Tag, Image, Pencil } from "lucide-react"
import { Card as CardType, cardsApi, checklistsApi, labelsApi, Label, Checklist } from "@/lib/api"
import ChecklistComponent from "./Checklist"
import ConfirmModal from "./ConfirmModal"

interface CardModalProps {
  card: CardType
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

const LABEL_COLORS = ["681314", "B75142", "747880", "FFFFFF"]

export default function CardModal({ card, onClose, onUpdated, onDeleted }: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || "")
  const [deadline, setDeadline] = useState(card.deadline ? card.deadline.slice(0, 10) : "")
  const [tempDeadline, setTempDeadline] = useState(deadline)
  const [newChecklistName, setNewChecklistName] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [showLabelsModal, setShowLabelsModal] = useState(false)
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0])
  const [editingLabel, setEditingLabel] = useState<Label | null>(null)
  const [labels, setLabels] = useState<Label[]>(card.labels || [])
  const [checklists, setChecklists] = useState<Checklist[]>(card.checklists || [])
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "card" | "label"; id?: string; name?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    let deadlineISO: string | undefined
    if (deadline) {
      const [year, month, day] = deadline.split("-").map(Number)
      const date = new Date(year, month - 1, day, 12, 0, 0)
      deadlineISO = date.toISOString()
    }
    await cardsApi.update(card.id, {
      title,
      description: description || undefined,
      deadline: deadlineISO,
    })
    onUpdated()
  }

  const handleDeleteCard = async () => {
    await cardsApi.delete(card.id)
    onDeleted()
  }

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await cardsApi.uploadCover(card.id, file)
    onUpdated()
  }

  const handleRemoveCover = async () => {
    await cardsApi.update(card.id, { cover_url: "" })
    onUpdated()
  }

  const handleSaveDeadline = async () => {
    setDeadline(tempDeadline)
    let deadlineISO: string | undefined
    if (tempDeadline) {
      const [year, month, day] = tempDeadline.split("-").map(Number)
      const date = new Date(year, month - 1, day, 12, 0, 0)
      deadlineISO = date.toISOString()
    }
    await cardsApi.update(card.id, { deadline: deadlineISO })
    setShowDeadlineModal(false)
    onUpdated()
  }

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChecklistName.trim()) return
    await checklistsApi.create(card.id, { name: newChecklistName.trim() })
    setNewChecklistName("")
    setRefreshKey((k) => k + 1)
    onUpdated()
  }

  const handleChecklistUpdated = (deletedId?: string) => {
    if (deletedId) {
      setChecklists(checklists.filter((cl) => cl.id !== deletedId))
    }
    setRefreshKey((k) => k + 1)
    onUpdated()
  }

  const handleChecklistsReorder = async (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return
    if (source.index === destination.index) return

    const reordered = Array.from(checklists)
    const [moved] = reordered.splice(source.index, 1)
    reordered.splice(destination.index, 0, moved)
    setChecklists(reordered)
    await checklistsApi.reorder(reordered.map((cl) => cl.id))
  }

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabelName.trim()) return
    const label = await labelsApi.create(card.id, { name: newLabelName.trim(), color: newLabelColor })
    setLabels([...labels, label])
    setNewLabelName("")
    onUpdated()
  }

  const handleUpdateLabel = async (label: Label, data: { name?: string; color?: string }) => {
    const updated = await labelsApi.update(label.id, data)
    setLabels(labels.map((l) => (l.id === label.id ? updated : l)))
    setEditingLabel(null)
    setNewLabelName("")
    onUpdated()
  }

  const handleDeleteLabel = async () => {
    if (!deleteConfirm?.id) return
    await labelsApi.delete(deleteConfirm.id)
    setLabels(labels.filter((l) => l.id !== deleteConfirm.id))
    setDeleteConfirm(null)
    setEditingLabel(null)
    onUpdated()
  }

  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="modal-overlay modal-overlay-scroll" onClick={onClose}>
      <div className="modal trello-modal" onClick={(e) => e.stopPropagation()}>
        {card.cover_url && (
          <div className="modal-cover">
            <img src={`http://localhost:8000${card.cover_url}`} alt="" />
            <button className="modal-cover-remove" onClick={handleRemoveCover}>
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div className="modal-header">
          <input
            className="modal-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
          />
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {labels.length > 0 && (
          <div className="modal-labels-bar">
            <span className="modal-labels-title">Etiquetas</span>
            <div className="modal-labels-list">
              {labels.map((label) => (
                <span
                  key={label.id}
                  className={`modal-label-chip ${label.color === "FFFFFF" ? "label-white" : ""}`}
                  style={{ backgroundColor: `#${label.color}` }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {deadline && (
          <div className="modal-labels-bar">
            <span className="modal-labels-title">Prazo</span>
            <div className="modal-labels-list">
              <span className={`modal-label-chip label-deadline ${new Date(deadline) < new Date() ? "deadline-expired" : ""}`}>
                <Calendar size={12} />
                {formatDeadline(deadline)}
              </span>
            </div>
          </div>
        )}

        <div className="modal-body">
          <div className="modal-actions">
            <button className="modal-action-btn" onClick={() => fileInputRef.current?.click()}>
              <Image size={16} />
              Capa
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleUploadCover}
            />

            <button className="modal-action-btn" onClick={() => { setShowDeadlineModal(true); setTempDeadline(deadline) }}>
              <Calendar size={16} />
              Prazo
            </button>

            <button className="modal-action-btn" onClick={() => setShowLabelsModal(true)}>
              <Tag size={16} />
              Etiquetas
            </button>

            <button className="modal-action-btn btn-danger" onClick={() => setDeleteConfirm({ type: "card" })}>
              <Trash2 size={16} />
              Excluir
            </button>
          </div>

          <div className="modal-section">
            <h3>Descrição</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              placeholder="Adicione uma descrição..."
              rows={4}
            />
          </div>

          <div className="modal-section">
            <h3>Checklists</h3>
            <DragDropContext onDragEnd={handleChecklistsReorder}>
              <Droppable droppableId="checklists">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {checklists.map((cl, index) => (
                      <Draggable key={cl.id} draggableId={cl.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <ChecklistComponent checklist={cl} onUpdated={handleChecklistUpdated} dragHandleProps={provided.dragHandleProps} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <form className="add-checklist-form" onSubmit={handleCreateChecklist}>
              <input
                value={newChecklistName}
                onChange={(e) => setNewChecklistName(e.target.value)}
                placeholder="Nova checklist..."
              />
              <button type="submit" className="btn-primary btn-sm">Adicionar</button>
            </form>
          </div>
        </div>
      </div>

      {showDeadlineModal && (
        <div className="popup-overlay" onClick={(e) => { e.stopPropagation(); setShowDeadlineModal(false) }}>
          <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Prazo</h3>
              <button className="btn-icon" onClick={() => setShowDeadlineModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="popup-body">
              <input
                type="date"
                value={tempDeadline}
                onChange={(e) => setTempDeadline(e.target.value)}
              />
              {tempDeadline && (
                <button className="btn-text btn-danger-text" onClick={() => setTempDeadline("")}>
                  Remover prazo
                </button>
              )}
              <div className="popup-actions">
                <button className="btn-primary" onClick={handleSaveDeadline}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLabelsModal && (
        <div className="popup-overlay" onClick={(e) => { e.stopPropagation(); setShowLabelsModal(false); setEditingLabel(null); setNewLabelName("") }}>
          <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Etiquetas</h3>
              <button className="btn-icon" onClick={() => { setShowLabelsModal(false); setEditingLabel(null); setNewLabelName("") }}>
                <X size={16} />
              </button>
            </div>
            <div className="popup-body">
              {!editingLabel && labels.length > 0 && (
                <div className="labels-list-edit">
                  {labels.map((label) => (
                    <div key={label.id} className="label-edit-item">
                      <span
                        className={`modal-label-chip ${label.color === "FFFFFF" ? "label-white" : ""}`}
                        style={{ backgroundColor: `#${label.color}` }}
                      >
                        {label.name}
                      </span>
                      <div className="label-edit-actions">
                        <button className="btn-icon" onClick={() => { setEditingLabel(label); setNewLabelName(label.name); setNewLabelColor(label.color) }}>
                          <Pencil size={12} />
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => setDeleteConfirm({ type: "label", id: label.id, name: label.name })}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form className="label-form" onSubmit={editingLabel ? (e) => { e.preventDefault(); handleUpdateLabel(editingLabel, { name: newLabelName || editingLabel.name, color: newLabelColor }) } : handleCreateLabel}>
                <h4>{editingLabel ? "Editar" : "Nova"} etiqueta</h4>
                <input
                  value={editingLabel ? newLabelName || editingLabel.name : newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Nome da etiqueta"
                />
                <div className="label-colors">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`label-color-btn ${(editingLabel ? editingLabel.color : newLabelColor) === color ? "selected" : ""}`}
                      style={{ backgroundColor: `#${color}` }}
                      onClick={() => setNewLabelColor(color)}
                    />
                  ))}
                </div>
                <div className="label-form-actions">
                  <button type="submit" className="btn-primary btn-sm">
                    {editingLabel ? "Salvar" : "Adicionar"}
                  </button>
                  {editingLabel && (
                    <button type="button" className="btn-secondary btn-sm" onClick={() => { setEditingLabel(null); setNewLabelName("") }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title={deleteConfirm.type === "card" ? "Deletar card" : "Deletar etiqueta"}
          message={deleteConfirm.type === "card" ? "Tem certeza que deseja deletar este card?" : `Tem certeza que deseja deletar a etiqueta "${deleteConfirm.name}"?`}
          onConfirm={deleteConfirm.type === "card" ? handleDeleteCard : handleDeleteLabel}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
