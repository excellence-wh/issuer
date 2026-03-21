import { toast } from 'sonner'

export function showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) {
  const content = message ? `${title}\n${message}` : title
  const duration = type === 'error' ? 5000 : 4000
  
  switch (type) {
    case 'success':
      toast.success(content, { duration })
      break
    case 'error':
      toast.error(content, { duration })
      break
    case 'warning':
      toast.warning(content, { duration })
      break
    case 'info':
      toast.info(content, { duration })
      break
  }
}