"use client"

import { useEffect, useState } from "react"

interface ToastProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const duration = 3000
    const interval = 50
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          onClose()
          return 0
        }
        return prev - step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [onClose])

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-message">{message}</span>
      <div className="toast-progress">
        <div className="toast-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
