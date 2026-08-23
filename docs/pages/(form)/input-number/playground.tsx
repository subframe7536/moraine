import { InputNumber } from '@src'
import type { InputNumberT } from '@src'
import { createSignal } from 'solid-js'

export interface InputNumberPlaygroundProps {
  variant?: InputNumberT.Variant['variant']
  size?: InputNumberT.Variant['size']
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  increment?: boolean
}

export function InputNumberPlayground(props: InputNumberPlaygroundProps) {
  const [value, setValue] = createSignal(1)

  return (
    <div class="max-w-full w-64">
      <InputNumber
        value={value()}
        onValueChange={(val: number | null) => {
          if (typeof val === 'number') {
            setValue(val)
          }
        }}
        variant={props.variant ?? 'outline'}
        size={props.size ?? 'md'}
        orientation={props.orientation ?? 'horizontal'}
        disabled={props.disabled ?? false}
        increment={props.increment ?? true}
        min={0}
        max={100}
      />
    </div>
  )
}
