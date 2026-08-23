import { Stepper, Switch } from '@src'
import { createSignal } from 'solid-js'

export function ClickableVsReadOnly() {
  const [clickable, setClickable] = createSignal(false)
  const [linear, setLinear] = createSignal(true)
  const checkoutSteps = [
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

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap gap-4">
        <Switch checked={clickable()} label="Clickable" onChange={setClickable} />
        <Switch checked={linear()} label="Linear" onChange={setLinear} />
      </div>

      <Stepper
        items={checkoutSteps}
        defaultValue="address"
        clickable={clickable()}
        linear={linear()}
      />
    </div>
  )
}
