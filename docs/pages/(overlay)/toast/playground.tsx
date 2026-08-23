import 'solid-toaster/style.css'

import { Button } from '@src'
import { toast } from 'solid-toaster'

export interface ToastPlaygroundProps {
  message?: string
  tone?: 'success' | 'warning' | 'error'
}

export function ToastPlayground(props: ToastPlaygroundProps) {
  const showToast = () => {
    const message = props.message ?? 'Changes saved'
    switch (props.tone ?? 'success') {
      case 'warning':
        toast.warning(message)
        break
      case 'error':
        toast.error(message)
        break
      default:
        toast.success(message)
    }
  }

  return <Button onClick={showToast}>Show toast</Button>
}
