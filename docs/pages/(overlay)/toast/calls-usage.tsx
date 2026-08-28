import { Button } from '@src'
import { toast, Toaster } from 'solid-toaster'

export function CallsUsage() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Toaster position="bottom-right" />
      <Button variant="outline" onClick={() => toast.success('Changes saved successfully!')}>
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error('Failed to update repository settings.')}
      >
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Low storage remaining on volume.')}>
        Warning
      </Button>
    </div>
  )
}
