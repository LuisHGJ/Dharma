"use client"

import { useState, useEffect, useCallback } from "react"
import { Target, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { goalsApi, GoalPeriod, GoalCategory, Goal } from "@/lib/api"
import ConfirmModal from "../components/ConfirmModal"

const CATEGORY_COLORS = [
  { value: "681314", label: "Vermelho" },
  { value: "B75112", label: "Laranja" },
  { value: "747880", label: "Cinza" },
  { value: "22C55E", label: "Verde" },
  { value: "3B82F6", label: "Azul" },
  { value: "A855F7", label: "Roxo" },
  { value: "EAB308", label: "Amarelo" },
]

function getProgressColor(pct: number): string {
  if (pct < 33) return "#EF4444"
  if (pct < 66) return "#EAB308"
  return "#22C55E"
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function GoalsPage() {
  const [periods, setPeriods] = useState<GoalPeriod[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const [showPeriodForm, setShowPeriodForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<GoalPeriod | null>(null)
  const [periodName, setPeriodName] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<GoalCategory | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categoryColor, setCategoryColor] = useState("681314")

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [goalCategoryId, setGoalCategoryId] = useState<string | null>(null)
  const [goalName, setGoalName] = useState("")
  const [goalInitial, setGoalInitial] = useState("0")
  const [goalTarget, setGoalTarget] = useState("0")
  const [goalCurrent, setGoalCurrent] = useState("0")
  const [goalUnit, setGoalUnit] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<{ type: "period" | "category" | "goal"; id: string; name: string } | null>(null)

  const fetchPeriods = useCallback(async () => {
    const data = await goalsApi.listPeriods()
    setPeriods(data)
    if (!selectedPeriodId && data.length > 0) {
      setSelectedPeriodId(data[0].id)
    }
  }, [selectedPeriodId])

  useEffect(() => {
    fetchPeriods()
  }, [])

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId) || null

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const openCreatePeriod = () => {
    setEditingPeriod(null)
    setPeriodName("")
    setPeriodStart("")
    setPeriodEnd("")
    setShowPeriodForm(true)
  }

  const openEditPeriod = (period: GoalPeriod) => {
    setEditingPeriod(period)
    setPeriodName(period.name)
    setPeriodStart(period.start_date)
    setPeriodEnd(period.end_date)
    setShowPeriodForm(true)
  }

  const handleSavePeriod = async () => {
    if (!periodName.trim() || !periodStart || !periodEnd) return
    if (editingPeriod) {
      await goalsApi.updatePeriod(editingPeriod.id, {
        name: periodName.trim(),
        start_date: periodStart,
        end_date: periodEnd,
      })
    } else {
      const created = await goalsApi.createPeriod({
        name: periodName.trim(),
        start_date: periodStart,
        end_date: periodEnd,
      })
      setSelectedPeriodId(created.id)
    }
    setShowPeriodForm(false)
    fetchPeriods()
  }

  const openCreateCategory = () => {
    setEditingCategory(null)
    setCategoryName("")
    setCategoryColor("681314")
    setShowCategoryForm(true)
  }

  const openEditCategory = (cat: GoalCategory) => {
    setEditingCategory(cat)
    setCategoryName(cat.name)
    setCategoryColor(cat.color)
    setShowCategoryForm(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryName.trim() || !selectedPeriodId) return
    if (editingCategory) {
      await goalsApi.updateCategory(editingCategory.id, {
        name: categoryName.trim(),
        color: categoryColor,
      })
    } else {
      await goalsApi.createCategory(selectedPeriodId, {
        name: categoryName.trim(),
        color: categoryColor,
      })
    }
    setShowCategoryForm(false)
    fetchPeriods()
  }

  const openCreateGoal = (categoryId: string) => {
    setEditingGoal(null)
    setGoalCategoryId(categoryId)
    setGoalName("")
    setGoalInitial("0")
    setGoalTarget("100")
    setGoalCurrent("0")
    setGoalUnit("")
    setShowGoalForm(true)
  }

  const openEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setGoalCategoryId(goal.category_id)
    setGoalName(goal.name)
    setGoalInitial(String(goal.initial_value))
    setGoalTarget(String(goal.target_value))
    setGoalCurrent(String(goal.current_value))
    setGoalUnit(goal.unit)
    setShowGoalForm(true)
  }

  const handleSaveGoal = async () => {
    if (!goalName.trim() || !goalCategoryId) return
    const data = {
      name: goalName.trim(),
      initial_value: parseFloat(goalInitial) || 0,
      target_value: parseFloat(goalTarget) || 0,
      current_value: parseFloat(goalCurrent) || 0,
      unit: goalUnit.trim(),
    }
    if (editingGoal) {
      await goalsApi.updateGoal(editingGoal.id, data)
    } else {
      await goalsApi.createGoal(goalCategoryId, data)
    }
    setShowGoalForm(false)
    fetchPeriods()
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.type === "period") {
      await goalsApi.deletePeriod(deleteTarget.id)
      if (selectedPeriodId === deleteTarget.id) setSelectedPeriodId(null)
    } else if (deleteTarget.type === "category") {
      await goalsApi.deleteCategory(deleteTarget.id)
    } else {
      await goalsApi.deleteGoal(deleteTarget.id)
    }
    setDeleteTarget(null)
    fetchPeriods()
  }

  return (
    <div className="songs-page">
      <header className="songs-header">
        <div className="songs-header-left">
          <Target size={24} />
          <h1>Metas</h1>
        </div>
        <div className="songs-header-right">
          <button className="btn-primary" onClick={openCreatePeriod}>
            <Plus size={16} />
            Novo periodo
          </button>
        </div>
      </header>

      {periods.length > 0 && (
        <div className="goals-period-tabs">
          {periods.map((p) => (
            <button
              key={p.id}
              className={`goals-period-tab${p.id === selectedPeriodId ? " active" : ""}`}
              onClick={() => setSelectedPeriodId(p.id)}
            >
              <span>{p.name}</span>
              <span className="goals-period-dates">{formatDate(p.start_date)} - {formatDate(p.end_date)}</span>
            </button>
          ))}
        </div>
      )}

      {selectedPeriod && (
        <div className="goals-content">
          <div className="goals-period-header">
            <div>
              <h2>{selectedPeriod.name}</h2>
              <span className="goals-period-range">
                {formatDate(selectedPeriod.start_date)} - {formatDate(selectedPeriod.end_date)}
              </span>
            </div>
            <div className="goals-period-actions">
              <button className="btn-icon" onClick={() => openEditPeriod(selectedPeriod)}>
                <Pencil size={14} />
              </button>
              <button className="btn-icon btn-danger" onClick={() => setDeleteTarget({ type: "period", id: selectedPeriod.id, name: selectedPeriod.name })}>
                <Trash2 size={14} />
              </button>
              <button className="btn-primary" onClick={openCreateCategory}>
                <Plus size={16} />
                Nova categoria
              </button>
            </div>
          </div>

          {selectedPeriod.categories.length === 0 ? (
            <div className="goals-empty">
              Nenhuma categoria criada. Clique em "Nova categoria" para comecar.
            </div>
          ) : (
            <div className="goals-categories">
              {selectedPeriod.categories.map((cat) => {
                const isExpanded = expandedCategories.has(cat.id)
                return (
                  <div key={cat.id} className="goals-category">
                    <div className="goals-category-header" onClick={() => toggleCategory(cat.id)}>
                      <div className="goals-category-left">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span className="goals-category-dot" style={{ backgroundColor: `#${cat.color}` }} />
                        <span className="goals-category-name">{cat.name}</span>
                        <span className="goals-category-count">{cat.goals.length} metas</span>
                      </div>
                      <div className="goals-category-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-icon" onClick={() => openCreateGoal(cat.id)}>
                          <Plus size={14} />
                        </button>
                        <button className="btn-icon" onClick={() => openEditCategory(cat)}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => setDeleteTarget({ type: "category", id: cat.id, name: cat.name })}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="goals-category-body">
                        {cat.goals.length === 0 ? (
                          <div className="goals-empty-inline">Nenhuma meta nesta categoria.</div>
                        ) : (
                          cat.goals.map((goal) => {
                            const range = goal.target_value - goal.initial_value
                            const progress = range > 0 ? ((goal.current_value - goal.initial_value) / range) * 100 : 0
                            const pct = Math.max(0, Math.min(100, progress))
                            const color = getProgressColor(pct)
                            return (
                              <div key={goal.id} className="goals-goal">
                                <div className="goals-goal-top">
                                  <span className="goals-goal-name">{goal.name}</span>
                                  <div className="goals-goal-actions">
                                    <button className="btn-icon" onClick={() => openEditGoal(goal)}>
                                      <Pencil size={12} />
                                    </button>
                                    <button className="btn-icon btn-danger" onClick={() => setDeleteTarget({ type: "goal", id: goal.id, name: goal.name })}>
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                                <div className="goals-goal-bar-wrapper">
                                  <div className="goals-goal-bar-bg">
                                    <div className="goals-goal-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                                  </div>
                                  <span className="goals-goal-values">
                                    {goal.current_value}{goal.unit ? ` ${goal.unit}` : ""} / {goal.target_value}{goal.unit ? ` ${goal.unit}` : ""}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!selectedPeriodId && periods.length === 0 && (
        <div className="goals-empty">
          Nenhum periodo de metas criado. Clique em "Novo periodo" para comecar.
        </div>
      )}

      {showPeriodForm && (
        <div className="modal-overlay" onClick={() => setShowPeriodForm(false)}>
          <div className="modal songs-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPeriod ? "Editar periodo" : "Novo periodo"}</h2>
              <button className="btn-icon" onClick={() => setShowPeriodForm(false)}><span>&times;</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome</label>
                <input type="text" value={periodName} onChange={(e) => setPeriodName(e.target.value)} placeholder="Ex: Setembro 2026" autoFocus />
              </div>
              <div className="form-group">
                <label>Data inicial</label>
                <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Data final</label>
                <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPeriodForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSavePeriod}>{editingPeriod ? "Salvar" : "Criar"}</button>
            </div>
          </div>
        </div>
      )}

      {showCategoryForm && (
        <div className="modal-overlay" onClick={() => setShowCategoryForm(false)}>
          <div className="modal songs-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? "Editar categoria" : "Nova categoria"}</h2>
              <button className="btn-icon" onClick={() => setShowCategoryForm(false)}><span>&times;</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome</label>
                <input type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Ex: Saude, Financeiro..." autoFocus />
              </div>
              <div className="form-group">
                <label>Cor</label>
                <div className="goals-color-options">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className={`goals-color-btn${categoryColor === c.value ? " selected" : ""}`}
                      style={{ backgroundColor: `#${c.value}` }}
                      onClick={() => setCategoryColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCategoryForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveCategory}>{editingCategory ? "Salvar" : "Criar"}</button>
            </div>
          </div>
        </div>
      )}

      {showGoalForm && (
        <div className="modal-overlay" onClick={() => setShowGoalForm(false)}>
          <div className="modal songs-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGoal ? "Editar meta" : "Nova meta"}</h2>
              <button className="btn-icon" onClick={() => setShowGoalForm(false)}><span>&times;</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome</label>
                <input type="text" value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Ex: Correr 50km" autoFocus />
              </div>
              <div className="form-group">
                <label>Unidade (opcional)</label>
                <input type="text" value={goalUnit} onChange={(e) => setGoalUnit(e.target.value)} placeholder="Ex: km, R$, kg..." />
              </div>
              <div className="goals-value-row">
                <div className="form-group">
                  <label>Valor inicial</label>
                  <input type="number" value={goalInitial} onChange={(e) => setGoalInitial(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Valor atual</label>
                  <input type="number" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Valor final</label>
                  <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowGoalForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveGoal}>{editingGoal ? "Salvar" : "Criar"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title={`Deletar ${deleteTarget.type === "period" ? "periodo" : deleteTarget.type === "category" ? "categoria" : "meta"}`}
          message={`Tem certeza que deseja deletar "${deleteTarget.name}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
