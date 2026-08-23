import 'solid-toaster/style.css'

import { Button } from '@src'
import { toast } from 'solid-toaster'

export interface ToastPlaygroundProps {
  message?: string
  tone?: 'success' | 'warning' | 'error' | 'info'
}

export function ToastPlayground(props: ToastPlaygroundProps) {
  const showToast = () => {
    const message = props.message ?? 'Changes saved successfully'
    switch (props.tone ?? 'success') {
      case 'warning':
        toast.warning(message)
        break
      case 'error':
        toast.error(message)
        break
      case 'info':
        toast(message)
        break
      default:
        toast.success(message)
    }
  }

  return (
    <Button onClick={showToast} variant="outline" leading="i-lucide:bell">
      Trigger Toast Notification
    </Button>
  )
}
