import { InputNumber } from '@src'

export function MinMaxStep() {
  return (
    <div class="flex flex-wrap gap-6 items-start">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">Step 5 (0–100)</label>
        <InputNumber defaultValue={25} minValue={0} maxValue={100} step={5} />
      </div>
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">Step 0.1 (0–1)</label>
        <InputNumber defaultValue={0.5} minValue={0} maxValue={1} step={0.1} />
      </div>
    </div>
  )
}
