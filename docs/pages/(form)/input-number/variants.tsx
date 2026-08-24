import { InputNumber } from '@src'

export function Variants() {
  return (
    <div class="gap-4 grid max-w-xl sm:grid-cols-2">
      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">Outline (Checkout quantity)</label>
        <InputNumber variant="outline" defaultValue={2} minValue={1} />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">
          Subtle (Dashboard target metric)
        </label>
        <InputNumber variant="subtle" defaultValue={25} step={5} />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">
          Ghost (Inline table counter)
        </label>
        <InputNumber variant="ghost" defaultValue={10} />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">
          None (Custom panel container)
        </label>
        <div class="p-2 b-(1 border) rounded-lg bg-card inline-block">
          <InputNumber variant="none" defaultValue={100} step={10} />
        </div>
      </div>
    </div>
  )
}
