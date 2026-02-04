import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 3000,
    }
    setToasts((prev) => [...prev, newToast])
    
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, newToast.duration)
    
    return id
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
  }
}
