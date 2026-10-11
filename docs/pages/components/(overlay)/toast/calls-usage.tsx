import { Button, Toast } from '@src'

export function CallsUsage() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button variant="outline" onClick={() => Toast.success('Changes saved successfully!')}>
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => Toast.error('Failed to update repository settings.')}
      >
        Error
      </Button>
      <Button variant="outline" onClick={() => Toast.warning('Low storage remaining on volume.')}>
        Warning
      </Button>
    </div>
  )
}
