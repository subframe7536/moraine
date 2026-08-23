import { Slider } from '@src'
import type { SliderT } from '@src'
import { createSignal } from 'solid-js'

export interface SliderPlaygroundProps {
  variant?: SliderT.Variant['variant']
  size?: SliderT.Variant['size']
  disabled?: boolean
  inverted?: boolean
}

export function SliderPlayground(props: SliderPlaygroundProps) {
  const [value, setValue] = createSignal(65)

  return (
    <div class="max-w-full w-80 space-y-3">
      <div class="text-xs text-muted-foreground flex items-center justify-between">
        <span>Volume level</span>
        <span class="text-foreground font-medium font-mono">{value()}%</span>
      </div>
      <Slider
        value={value()}
        onValueChange={(val) => {
          if (typeof val === 'number') {
            setValue(val)
          }
        }}
        variant={props.variant ?? 'default'}
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        inverted={props.inverted ?? false}
      />
    </div>
  )
}
