import { Slider } from '@src'

export function Disabled() {
  return (
    <div class="w-lg space-y-5">
      <Slider divider disabled min={0} max={100} step={10} defaultValue={35} />
      <Slider divider disabled variant="bold" min={0} max={100} step={10} defaultValue={[25, 75]} />
    </div>
  )
}
