const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Erro desconhecido" }))
    throw new Error(error.detail || "Erro na requisição")
  }
  return res.json()
}

// Types
export interface Column {
  id: string
  name: string
  position: number
  created_at: string
}

export interface ChecklistItem {
  id: string
  checklist_id: string
  text: string
  is_checked: boolean
  position: number
  created_at: string
}

export interface Checklist {
  id: string
  card_id: string
  name: string
  position: number
  created_at: string
  items: ChecklistItem[]
}

export interface Card {
  id: string
  column_id: string
  title: string
  cover_url: string | null
  deadline: string | null
  description: string | null
  position: number
  created_at: string
  updated_at: string
  checklists: Checklist[]
  labels: Label[]
}

export interface Label {
  id: string
  card_id: string
  name: string
  color: string
  created_at: string
}

// Columns
export const columnsApi = {
  list: () => request<Column[]>("/columns/"),
  create: (data: { name: string; position?: number }) =>
    request<Column>("/columns/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; position?: number }) =>
    request<Column>(`/columns/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/columns/${id}`, { method: "DELETE" }),
  reorder: (ordered_ids: string[]) =>
    request<{ ok: boolean }>("/columns/reorder", { method: "POST", body: JSON.stringify({ ordered_ids }) }),
}

// Cards
export const cardsApi = {
  list: (columnId?: string) => {
    const params = columnId ? `?column_id=${columnId}` : ""
    return request<Card[]>(`/cards/${params}`)
  },
  create: (data: { column_id: string; title: string; description?: string; deadline?: string }) =>
    request<Card>("/cards/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; description?: string; deadline?: string; cover_url?: string; position?: number }) =>
    request<Card>(`/cards/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/cards/${id}`, { method: "DELETE" }),
  move: (id: string, data: { column_id: string; position: number }) =>
    request<Card>(`/cards/${id}/move`, { method: "POST", body: JSON.stringify(data) }),
  uploadCover: async (id: string, file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(`${API_URL}/cards/${id}/cover`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error("Erro no upload")
    return res.json() as Promise<Card>
  },
}

// Checklists
export const checklistsApi = {
  list: (cardId: string) => request<Checklist[]>(`/cards/${cardId}/checklists`),
  create: (cardId: string, data: { name: string }) =>
    request<Checklist>(`/cards/${cardId}/checklists`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string }) =>
    request<Checklist>(`/checklists/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/checklists/${id}`, { method: "DELETE" }),
  createItem: (checklistId: string, data: { text: string }) =>
    request<ChecklistItem>(`/checklists/${checklistId}/items`, { method: "POST", body: JSON.stringify(data) }),
  updateItem: (id: string, data: { text?: string; is_checked?: boolean }) =>
    request<ChecklistItem>(`/checklist-items/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteItem: (id: string) =>
    request<{ ok: boolean }>(`/checklist-items/${id}`, { method: "DELETE" }),
  reorder: (ordered_ids: string[]) =>
    request<{ ok: boolean }>("/checklists/reorder", { method: "POST", body: JSON.stringify({ ordered_ids }) }),
  reorderItems: (ordered_ids: string[]) =>
    request<{ ok: boolean }>("/checklist-items/reorder", { method: "POST", body: JSON.stringify({ ordered_ids }) }),
}

// Backup
export const backupApi = {
  create: () => request<{ ok: boolean; filename: string }>("/backup/", { method: "POST" }),
  list: () => request<string[]>("/backup/"),
  download: (filename: string) => `${API_URL}/backup/download/${filename}`,
}

// Labels
export const labelsApi = {
  list: (cardId: string) => request<Label[]>(`/cards/${cardId}/labels`),
  create: (cardId: string, data: { name: string; color: string }) =>
    request<Label>(`/cards/${cardId}/labels`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; color?: string }) =>
    request<Label>(`/labels/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/labels/${id}`, { method: "DELETE" }),
}
