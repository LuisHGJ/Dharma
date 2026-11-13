"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Pencil, Trash2, ExternalLink, Search, Music } from "lucide-react"
import { songsApi, Song } from "@/lib/api"
import ConfirmModal from "../components/ConfirmModal"
import { AppLoader, AppLoadError } from "../components/AppStatus"

const BEAT_OPTIONS = [
  { value: "3", label: "3 tempos" },
  { value: "4", label: "4 tempos" },
]

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Song | null>(null)
  const [formName, setFormName] = useState("")
  const [formBeat, setFormBeat] = useState<string>("4")
  const [formUrl, setFormUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const hasLoadedRef = useRef(false)

  const fetchSongs = useCallback(async () => {
    try {
      const data = await songsApi.list()
      setSongs(data)
      hasLoadedRef.current = true
      setLoadError(false)
    } catch {
      if (!hasLoadedRef.current) setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSongs()
  }, [fetchSongs])

  const filtered = songs.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditingSong(null)
    setFormName("")
    setFormBeat("4")
    setFormUrl("")
    setShowForm(true)
  }

  const openEdit = (song: Song) => {
    setEditingSong(song)
    setFormName(song.name)
    setFormBeat(song.beat)
    setFormUrl(song.youtube_url)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formUrl.trim()) return

    if (editingSong) {
      await songsApi.update(editingSong.id, {
        name: formName.trim(),
        beat: formBeat,
        youtube_url: formUrl.trim(),
      })
    } else {
      await songsApi.create({
        name: formName.trim(),
        beat: formBeat,
        youtube_url: formUrl.trim(),
      })
    }

    setShowForm(false)
    fetchSongs()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await songsApi.delete(deleteConfirm.id)
    setDeleteConfirm(null)
    fetchSongs()
  }

  const handleRetry = () => {
    setLoadError(false)
    setLoading(true)
    fetchSongs()
  }

  if (loading || loadError) {
    return (
      <div className="songs-page">
        {loading ? <AppLoader /> : <AppLoadError onRetry={handleRetry} />}
      </div>
    )
  }

  return (
    <div className="songs-page">
      <header className="songs-header">
        <div className="songs-header-left">
          <Music size={24} />
          <h1>Músicas</h1>
        </div>
        <div className="songs-header-right">
          <div className="songs-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar música..."
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} />
            Nova música
          </button>
        </div>
      </header>

      <div className="songs-table-wrapper">
        <table className="songs-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Batida</th>
              <th>Link</th>
              <th className="songs-actions-col"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="songs-empty">
                  {search ? "Nenhuma música encontrada" : "Nenhuma música cadastrada"}
                </td>
              </tr>
            ) : (
              filtered.map((song) => (
                <tr key={song.id}>
                  <td className="songs-name-cell">{song.name}</td>
                  <td>
                    <span className={`songs-beat-badge beat-${song.beat}`}>
                      {song.beat} tempos
                    </span>
                  </td>
                  <td>
                    <a
                      href={song.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="songs-link"
                    >
                      <ExternalLink size={14} />
                      Abrir no YouTube
                    </a>
                  </td>
                  <td className="songs-actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(song)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn-icon btn-danger" onClick={() => setDeleteConfirm(song)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal songs-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSong ? "Editar música" : "Nova música"}</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}>
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome da música"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Batida</label>
                <div className="form-radio-group">
                  {BEAT_OPTIONS.map((opt) => (
                    <label key={opt.value} className="form-radio-label">
                      <input
                        type="radio"
                        name="beat"
                        value={opt.value}
                        checked={formBeat === opt.value}
                        onChange={() => setFormBeat(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Link do YouTube</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingSong ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Deletar música"
          message={`Tem certeza que deseja deletar "${deleteConfirm.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
