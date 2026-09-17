"use client"

import { useState } from "react"
import { LayoutGrid, Database } from "lucide-react"
import { backupApi } from "@/lib/api"
import Toast from "./Toast"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleBackup = async () => {
    try {
      await backupApi.create()
      setToast({ message: "Backup criado com sucesso!", type: "success" })
    } catch {
      setToast({ message: "Erro ao criar backup", type: "error" })
    }
  }

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <button className="sidebar-logo" onClick={() => setCollapsed(!collapsed)}>
        <img src="/dharma.webp" alt="Dharma" className="sidebar-logo-img" />
        {!collapsed && <span className="sidebar-logo-text">Dharma</span>}
      </button>
      <nav className="sidebar-nav">
        <a href="/" className="sidebar-item active">
          <LayoutGrid size={20} />
          {!collapsed && <span>Kanban</span>}
        </a>
      </nav>
      <div className="sidebar-bottom">
        <button className="sidebar-item sidebar-btn" onClick={handleBackup}>
          <Database size={20} />
          {!collapsed && <span>Backup</span>}
        </button>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </aside>
  )
}
