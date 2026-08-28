import { Slider } from '@src'
import { createSignal } from 'solid-js'

export function Values() {
  const [singleVal, setSingleVal] = createSignal(40)
  const [rangeVal, setRangeVal] = createSignal<[number, number]>([20, 80])

  return (
    <div class="max-w-md w-full space-y-6">
      <div class="space-y-2">
        <div class="text-xs text-muted-foreground flex justify-between">
          <span>Single volume</span>
          <span class="text-foreground font-mono">{singleVal()}%</span>
        </div>
        <Slider value={singleVal()} onChange={setSingleVal} />
      </div>

      <div class="space-y-2">
        <div class="text-xs text-muted-foreground flex justify-between">
          <span>Budget range</span>
          <span class="text-foreground font-mono">
            ${rangeVal()[0]} - ${rangeVal()[1]}
          </span>
        </div>
        <Slider value={rangeVal()} onChange={setRangeVal} />
      </div>
    </div>
  )
}
