import { Progress } from '@src'
import { createSignal } from 'solid-js'

export function Models() {
  const [value] = createSignal(65)

  return (
    <div class="max-w-md w-full space-y-4">
      <div class="space-y-1.5">
        <span class="text-muted-foreground text-xs">Determinate progress ({value()}%)</span>
        <Progress value={value()} />
      </div>
      <div class="space-y-1.5">
        <span class="text-muted-foreground text-xs">Indeterminate progress</span>
        <Progress />
      </div>
    </div>
  )
}
