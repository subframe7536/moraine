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
        onCheckedChange={setAllowThumbCrossing}
        label="Allow dragging across overlapping thumbs"
      />
      <Checkbox
        checked={minStepsBetweenThumbs() > 0}
        onCheckedChange={(isChecked) => setMinStepsBetweenThumbs(isChecked ? 10 : 0)}
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
      <p class="text-muted-foreground w-50 text-xs">
        Range: {rangeValue()[0]} - {rangeValue()[1]}
      </p>
      <p class="text-muted-foreground w-50 text-xs">
        Thumb crossing:{' '}
        {allowThumbCrossing() && minStepsBetweenThumbs() === 0 ? 'Enabled' : 'Constrained'}
      </p>
      <p class="text-muted-foreground w-50 text-xs">Min steps between: {minStepsBetweenThumbs()}</p>
    </div>
  )
}
