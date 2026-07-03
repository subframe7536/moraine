import { Stepper } from '@src'

export function ClickableVsReadOnly() {
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

  return (
    <div class="space-y-6">
      <div class="space-y-2">
        <p class="text-xs text-muted-foreground tracking-wide font-medium uppercase">
          Default (`linear=true`, `clickable=false`)
        </p>
        <Stepper items={createCheckoutSteps()} defaultValue="address" />
      </div>

      <div class="space-y-2">
        <p class="text-xs text-muted-foreground tracking-wide font-medium uppercase">
          Click enabled (`linear=true`, `clickable=true`)
        </p>
        <Stepper items={createCheckoutSteps()} defaultValue="address" clickable />
      </div>

      <div class="space-y-2">
        <p class="text-xs text-muted-foreground tracking-wide font-medium uppercase">
          Non-linear (`linear=false`, `clickable=true`)
        </p>
        <Stepper items={createCheckoutSteps()} defaultValue="address" linear={false} clickable />
      </div>
    </div>
  )
}
