"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { LayoutGrid, Database, Music, Target } from "lucide-react"
import { backupApi } from "@/lib/api"
import Toast from "./Toast"

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleBackup = async () => {
    try {
      const { filename } = await backupApi.create()
      // baixa o arquivo gerado para o PC
      const res = await fetch(backupApi.download(filename))
      if (!res.ok) throw new Error("Falha no download")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      setToast({ message: "Backup criado e baixado!", type: "success" })
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
        <a href="/" className={`sidebar-item${pathname === "/" ? " active" : ""}`}>
          <LayoutGrid size={20} />
          {!collapsed && <span>Kanban</span>}
        </a>
        <a href="/goals" className={`sidebar-item${pathname === "/goals" ? " active" : ""}`}>
          <Target size={20} />
          {!collapsed && <span>Metas</span>}
        </a>
        <a href="/songs" className={`sidebar-item${pathname === "/songs" ? " active" : ""}`}>
          <Music size={20} />
          {!collapsed && <span>Músicas</span>}
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
