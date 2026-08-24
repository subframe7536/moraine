import { InputNumber } from '@src'

export function MinMaxStep() {
  return (
    <div class="gap-4 grid max-w-xl sm:grid-cols-2">
      <div class="p-4 b-(1 border) rounded-xl space-y-2">
        <label class="text-xs text-muted-foreground tracking-wider font-semibold block uppercase">
          CPU Cores (1 to 32)
        </label>
        <InputNumber defaultValue={4} minValue={1} maxValue={32} step={1} />
        <p class="text-xs text-muted-foreground">Dedicated compute vCPUs</p>
      </div>

      <div class="p-4 b-(1 border) rounded-xl space-y-2">
        <label class="text-xs text-muted-foreground tracking-wider font-semibold block uppercase">
          RAM in GB (Step 2, Max 64)
        </label>
        <InputNumber defaultValue={16} minValue={2} maxValue={64} step={2} />
        <p class="text-xs text-muted-foreground">ECC high-throughput memory</p>
      </div>
    </div>
  )
}
