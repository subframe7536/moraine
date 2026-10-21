import { Slider } from '@src'

export function KeyboardForms() {
  return (
    <div class="max-w-md w-full">
      <Slider name="brightness" defaultValue={75} step={5} min={0} max={100} />
    </div>
  )
}
