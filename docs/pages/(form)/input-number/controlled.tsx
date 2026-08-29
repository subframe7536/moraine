import { Badge, InputNumber } from '@src'
import { createSignal } from 'solid-js'

export function Controlled() {
  const [quantity, setQuantity] = createSignal(2)
  const unitPrice = 49.0

  return (
    <div class="p-4 b-(1 border) rounded-xl max-w-md space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-medium">Mechanical Keyboard (Pro Edition)</h4>
          <p class="text-xs text-muted-foreground">$49.00 / unit</p>
        </div>
        <Badge variant="outline">In Stock</Badge>
      </div>

      <div class="pt-2 border-t border-border flex items-center justify-between">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground font-medium">Quantity (Max 10)</label>
          <InputNumber
            value={quantity()}
            onRawValueChange={(v) => {
              if (Number.isFinite(v)) {
                setQuantity(v)
              }
            }}
            minValue={1}
            maxValue={10}
            step={1}
            variant="outline"
          />
        </div>

        <div class="text-right">
          <p class="text-xs text-muted-foreground">Subtotal</p>
          <p class="text-lg text-primary font-mono font-semibold">
            ${(quantity() * unitPrice).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
