import { InputNumber } from '@src'

export function Orientations() {
  return (
    <div class="flex flex-wrap gap-6 items-start">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">Horizontal</label>
        <InputNumber defaultValue={5} minValue={0} maxValue={20} />
      </div>
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">Vertical</label>
        <InputNumber orientation="vertical" defaultValue={5} minValue={0} maxValue={20} />
      </div>
    </div>
  )
}
