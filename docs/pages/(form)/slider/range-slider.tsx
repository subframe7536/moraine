import { Checkbox, Slider } from '@src'
import { createSignal } from 'solid-js'

export function RangeSlider() {
  const [rangeValue, setRangeValue] = createSignal<number[]>([20, 75])
  const [minStepsBetweenThumbs, setMinStepsBetweenThumbs] = createSignal(0)
  const [allowThumbCrossing, setAllowThumbCrossing] = createSignal(true)

  return (
    <div class="max-w-xl space-y-3">
      <Checkbox
        checked={allowThumbCrossing()}
        onChange={setAllowThumbCrossing}
        label="Allow dragging across overlapping thumbs"
      />
      <Checkbox
        checked={minStepsBetweenThumbs() > 0}
        onChange={(isChecked) => setMinStepsBetweenThumbs(isChecked ? 10 : 0)}
        label="Min steps between thumbs"
      />
      <Slider
        value={rangeValue()}
        min={0}
        max={100}
        step={1}
        minStepsBetweenThumbs={minStepsBetweenThumbs()}
        allowThumbCrossing={allowThumbCrossing()}
        onValueChange={(next) => {
          if (Array.isArray(next)) {
            setRangeValue(next)
          }
        }}
      />
      <p class="text-xs text-muted-foreground w-50">
        Range: {rangeValue()[0]} - {rangeValue()[1]}
      </p>
      <p class="text-xs text-muted-foreground w-50">
        Thumb crossing:{' '}
        {allowThumbCrossing() && minStepsBetweenThumbs() === 0 ? 'Enabled' : 'Constrained'}
      </p>
      <p class="text-xs text-muted-foreground w-50">Min steps between: {minStepsBetweenThumbs()}</p>
    </div>
  )
}
