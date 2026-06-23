import { Stepper } from '@src'

export function LinearCheckout() {
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

  return <Stepper items={createCheckoutSteps()} defaultValue="address" clickable />
}
