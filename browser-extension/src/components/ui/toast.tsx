import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { Toast, ToastType } from '@/hooks/useToast'

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
  isDark?: boolean
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
  },
}

function ToastItem({
  toast,
  onClose,
  isDark,
}: {
  toast: Toast
  onClose: (id: string) => void
  isDark?: boolean
}) {
  const Icon = icons[toast.type]
  const color = colors[toast.type]

  return (
    <div
      className={`
        pointer-events-auto
        flex items-start gap-3
        w-full max-w-sm
        p-4 rounded-lg shadow-lg
        border ${color.border} ${color.bg}
        animate-in slide-in-from-right-full fade-in
        duration-300
      `}
      style={{
        background: isDark
          ? toast.type === 'success'
            ? 'rgba(20, 83, 45, 0.95)'
            : toast.type === 'error'
            ? 'rgba(127, 29, 29, 0.95)'
            : toast.type === 'warning'
            ? 'rgba(120, 53, 15, 0.95)'
            : 'rgba(30, 58, 138, 0.95)'
          : undefined,
      }}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${color.icon}`} />
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium text-sm ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {toast.title}
        </p>
        {toast.message && (
          <p
            className={`text-sm mt-1 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className={`
          shrink-0 p-1 rounded
          transition-colors
          ${
            isDark
              ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }
        `}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onClose, isDark }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-[2147483647] flex flex-col gap-2"
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onClose={onClose} isDark={isDark} />
        </div>
      ))}
    </div>
  )
}
