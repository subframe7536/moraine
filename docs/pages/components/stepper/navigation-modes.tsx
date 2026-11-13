import { Button, Stepper } from '@src'
import type { StepperT } from '@src'
import { For, createSignal } from 'solid-js'

type Navigation = NonNullable<StepperT.Base['navigation']>

const NAVIGATION_MODES: Navigation[] = ['none', 'linear', 'free']

export function NavigationModes() {
  const [navigation, setNavigation] = createSignal<Navigation>('linear')
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
      <div class="flex flex-wrap gap-2">
        <For each={NAVIGATION_MODES}>
          {(mode) => (
            <Button
              size="xs"
              variant={navigation() === mode ? 'solid' : 'outline'}
              onClick={() => setNavigation(mode)}
            >
              {mode}
            </Button>
          )}
        </For>
      </div>

      <Stepper items={checkoutSteps} defaultValue="address" navigation={navigation()} />
    </div>
  )
}
