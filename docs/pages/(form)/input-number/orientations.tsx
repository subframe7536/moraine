import { InputNumber } from '@src'

export function Orientations() {
  return (
    <div class="gap-6 grid max-w-xl sm:grid-cols-2">
      <div class="p-4 b-(1 border) rounded-xl space-y-2">
        <label class="text-xs text-muted-foreground tracking-wider font-semibold block uppercase">
          Horizontal (Order Quantity)
        </label>
        <InputNumber defaultValue={3} minValue={1} maxValue={20} />
        <p class="text-xs text-muted-foreground">Standard left-to-right stepper buttons</p>
      </div>

      <div class="p-4 b-(1 border) rounded-xl space-y-2">
        <label class="text-xs text-muted-foreground tracking-wider font-semibold block uppercase">
          Vertical (Inventory Stock)
        </label>
        <InputNumber orientation="vertical" defaultValue={12} minValue={0} maxValue={100} />
        <p class="text-xs text-muted-foreground">Stacked vertical stepper buttons</p>
      </div>
    </div>
  )
}
