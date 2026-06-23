import { Slider } from '@src'
import { createSignal } from 'solid-js'

export function ControlledSingle() {
  const [singleValue, setSingleValue] = createSignal(32)
  const [singleCommit, setSingleCommit] = createSignal(32)

  return (
    <div class="max-w-xl space-y-3">
      <Slider
        value={singleValue()}
        min={0}
        max={100}
        step={1}
        onValueChange={setSingleValue}
        onChange={setSingleCommit}
      />
      <p class="text-xs text-muted-foreground">Current value: {singleValue()}</p>
      <p class="text-xs text-muted-foreground">Last committed value: {singleCommit()}</p>
    </div>
  )
}
