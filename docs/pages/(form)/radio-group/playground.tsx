import { RadioGroup } from '@src'
import type { RadioGroupT } from '@src'
import { createSignal } from 'solid-js'

const PLAN_OPTIONS: RadioGroupT.Item[] = [
  { label: 'Hobby', value: 'hobby', description: 'Free forever for personal projects' },
  { label: 'Pro', value: 'pro', description: '$20/month for growing teams' },
  { label: 'Enterprise', value: 'enterprise', description: 'Custom scale and security' },
]

export interface RadioGroupPlaygroundProps {
  variant?: RadioGroupT.Variant['variant']
  size?: RadioGroupT.Variant['size']
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export function RadioGroupPlayground(props: RadioGroupPlaygroundProps) {
  const [selected, setSelected] = createSignal('pro')

  return (
    <div class="max-w-full w-96">
      <RadioGroup
        items={PLAN_OPTIONS}
        value={selected()}
        onChange={setSelected}
        variant={props.variant ?? 'card'}
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        orientation={props.orientation ?? 'vertical'}
      />
    </div>
  )
}
