import { Button, Toast } from '@src'

export function CallsUsage() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button
        variant="outline"
        onClick={() => Toast.success({ title: 'Changes saved successfully!' })}
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => Toast.error({ title: 'Failed to update repository settings.' })}
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => Toast.warning({ title: 'Low storage remaining on volume.' })}
      >
        Warning
      </Button>
    </div>
  )
}
