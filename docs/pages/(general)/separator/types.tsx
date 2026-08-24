import { Separator } from '@src'

export function Types() {
  return (
    <div class="p-4 b-(1 border) rounded-xl bg-card max-w-md space-y-3">
      <div class="text-sm font-semibold flex items-center justify-between">
        <span>Order Summary #8492</span>
        <span class="text-xs text-muted-foreground">Oct 24, 2026</span>
      </div>

      <Separator type="solid" />

      <div class="text-xs space-y-1.5">
        <div class="flex justify-between">
          <span>Moraine UI Pro (Team License)</span>
          <span class="font-mono">$199.00</span>
        </div>
        <div class="text-muted-foreground flex justify-between">
          <span>Priority 24/7 SLA Add-on</span>
          <span class="font-mono">$49.00</span>
        </div>
      </div>

      <Separator type="dashed" />

      <div class="text-xs text-muted-foreground flex justify-between">
        <span>Subtotal</span>
        <span class="font-mono">$248.00</span>
      </div>
      <div class="text-xs text-muted-foreground flex justify-between">
        <span>Estimated Sales Tax (8%)</span>
        <span class="font-mono">$19.84</span>
      </div>

      <Separator type="dotted" />

      <div class="text-sm font-semibold pt-1 flex justify-between">
        <span>Total Paid</span>
        <span class="text-primary font-mono">$267.84</span>
      </div>
    </div>
  )
}
