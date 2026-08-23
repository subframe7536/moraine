import { CheckboxGroup } from '@src'
import type { CheckboxGroupT } from '@src'
import { createSignal } from 'solid-js'

const NOTIFICATION_OPTIONS: CheckboxGroupT.Item[] = [
  { label: 'Email alerts', value: 'email', description: 'Weekly digests and critical updates' },
  {
    label: 'Push notifications',
    value: 'push',
    description: 'Instant alerts on mobile and desktop',
  },
  { label: 'SMS updates', value: 'sms', description: 'Security and login codes' },
]

export interface CheckboxGroupPlaygroundProps {
  variant?: CheckboxGroupT.Variant['variant']
  size?: CheckboxGroupT.Variant['size']
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export function CheckboxGroupPlayground(props: CheckboxGroupPlaygroundProps) {
  const [value, setValue] = createSignal<string[]>(['email'])

  return (
    <div class="max-w-full w-96">
      <CheckboxGroup
        items={NOTIFICATION_OPTIONS}
        value={value()}
        onChange={setValue}
        variant={props.variant ?? 'card'}
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        orientation={props.orientation ?? 'vertical'}
      />
    </div>
  )
}
