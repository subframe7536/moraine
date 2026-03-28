import { Stepper } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const createCheckoutSteps = () => [
    {
      title: 'Address',
      description: 'Where should we send the order?',
      icon: 'i-lucide:map-pinned',
      value: 'address',
      content: <p class="text-sm text-foreground">Collect shipping address details.</p>,
    },
    {
      title: 'Shipping',
      description: 'Choose a delivery method.',
      icon: 'i-lucide:truck',
      value: 'shipping',
      content: <p class="text-sm text-foreground">Pick standard, express, or local pickup.</p>,
    },
    {
      title: 'Payment',
      description: 'Confirm billing and payment.',
      icon: 'i-lucide:credit-card',
      value: 'payment',
      content: <p class="text-sm text-foreground">Review billing details and submit payment.</p>,
    },
  ]

  const STEPPER_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="space-y-6">
      <For each={STEPPER_SIZES}>
        {(size) => (
          <div class="space-y-2">
            <p class="text-xs text-muted-foreground tracking-wide font-medium uppercase">{size}</p>
            <Stepper items={createCheckoutSteps()} defaultValue="shipping" size={size} />
          </div>
        )}
      </For>
    </div>
  )
}
