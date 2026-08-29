import { Progress } from '@src'
import { createSignal } from 'solid-js'

export function Models() {
  const [value] = createSignal(65)

  return (
    <div class="max-w-md w-full space-y-4">
      <div class="space-y-1.5">
        <span class="text-xs text-muted-foreground">Determinate progress ({value()}%)</span>
        <Progress value={value()} />
      </div>
      <div class="space-y-1.5">
        <span class="text-xs text-muted-foreground">Indeterminate progress</span>
        <Progress />
      </div>
    </div>
  )
}
