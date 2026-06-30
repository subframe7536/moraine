import { Slider } from '@src'

export function Variants() {
  return (
    <div class="w-lg space-y-5">
      <div class="space-y-2">
        <label class="text-xs text-muted-foreground block uppercase">Default with divider</label>
        <Slider divider min={0} max={100} step={10} defaultValue={40} />
      </div>
      <div class="space-y-2">
        <label class="text-xs text-muted-foreground block uppercase">Bold with divider</label>
        <Slider divider variant="bold" min={0} max={100} step={10} defaultValue={60} />
      </div>
    </div>
  )
}
