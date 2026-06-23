import { Button, Progress } from '@src'
import { createSignal } from 'solid-js'

export function Determinate() {
  const [value, setValue] = createSignal(35)

  const increment = () => {
    setValue((current) => Math.min(current + 10, 100))
  }

  const reset = () => {
    setValue(0)
  }

  return (
    <div class="w-xl space-y-3">
      <Progress value={value()} status renderStatus={({ percent }) => `Completed ${percent}%`} />
      <div class="flex gap-2">
        <Button size="sm" variant="outline" onclick={increment}>
          +10%
        </Button>
        <Button size="sm" variant="ghost" onclick={reset}>
          Reset
        </Button>
      </div>
    </div>
  )
}
