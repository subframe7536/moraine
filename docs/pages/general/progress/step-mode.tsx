import { Button, Progress } from '@src'
import { createSignal } from 'solid-js'

export function StepMode() {
  const STEPS = ['Queued', 'Building', 'Deploying', 'Done']
  const [value, setValue] = createSignal(0)

  const next = () => {
    setValue((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const previous = () => {
    setValue((current) => Math.max(current - 1, 0))
  }

  const reset = () => {
    setValue(0)
  }

  return (
    <div class="w-xl space-y-3">
      <Progress value={value()} max={STEPS} status />
      <div class="text-xs text-muted-foreground">
        Current: {STEPS[value()]} ({value() + 1}/{STEPS.length})
      </div>
      <div class="flex gap-2">
        <Button size="sm" variant="outline" onClick={previous}>
          Back
        </Button>
        <Button size="sm" variant="outline" onClick={next}>
          Next
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  )
}
