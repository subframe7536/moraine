import { Slider } from '@src'
import { createSignal } from 'solid-js'

export function Orientations() {
  const [horizontalValue, setHorizontalValue] = createSignal(45)
  const [verticalValue, setVerticalValue] = createSignal(45)

  return (
    <div class="gap-8 grid items-start sm:grid-cols-2">
      <div class="w-50 space-y-2">
        <label class="text-xs text-muted-foreground block">Horizontal: {horizontalValue()}</label>
        <Slider value={horizontalValue()} onValueChange={setHorizontalValue} />
      </div>
      <div class="space-y-2">
        <label class="text-xs text-muted-foreground block">Vertical: {verticalValue()}</label>
        <div class="flex h-48 items-center">
          <Slider orientation="vertical" value={verticalValue()} onValueChange={setVerticalValue} />
        </div>
      </div>
    </div>
  )
}
