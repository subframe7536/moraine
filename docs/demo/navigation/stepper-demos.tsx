import { For, createSignal } from 'solid-js'

import { Button, Stepper } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function SizeVariants() {
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

function LinearCheckout() {
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

function ClickableVsReadOnly() {
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

function ControlledNonLinear() {
  const RELEASE_STEPS = () => [
    {
      title: 'Draft',
      value: 'draft',
      content: <p class="text-sm text-foreground">Prepare release notes.</p>,
    },
    {
      title: 'Review',
      value: 'review',
      content: <p class="text-sm text-foreground">Collect team approvals.</p>,
    },
    {
      title: 'Ship',
      value: 'ship',
      content: <p class="text-sm text-foreground">Deploy to production.</p>,
    },
  ]

  const [releaseStep, setReleaseStep] = createSignal('review')

  return (
    <div class="space-y-4">
      <Stepper
        items={RELEASE_STEPS()}
        value={releaseStep()}
        onChange={setReleaseStep}
        linear={false}
      />
      <div class="flex flex-wrap gap-2 items-center">
        <Button size="sm" variant="outline" onclick={() => setReleaseStep('draft')}>
          Go to draft
        </Button>
        <Button size="sm" variant="outline" onclick={() => setReleaseStep('review')}>
          Go to review
        </Button>
        <Button size="sm" variant="outline" onclick={() => setReleaseStep('ship')}>
          Go to ship
        </Button>
        <p class="text-xs text-muted-foreground">Current step: {releaseStep()}</p>
      </div>
    </div>
  )
}

function Vertical() {
  const PIPELINE_STEPS = () => [
    {
      title: 'Queued',
      description: 'Waiting for worker capacity.',
      value: 'queued',
      content: <p class="text-sm text-foreground">This job is waiting in the queue.</p>,
    },
    {
      title: 'Building',
      description: 'Compiling and bundling assets.',
      value: 'building',
      content: <p class="text-sm text-foreground">The current build is running.</p>,
    },
    {
      title: 'Ready',
      description: 'Artifacts are available.',
      value: 'ready',
      content: <p class="text-sm text-foreground">The deployment artifact is ready to use.</p>,
    },
  ]

  return (
    <div class="max-w-3xl">
      <Stepper items={PIPELINE_STEPS()} orientation="vertical" defaultValue="building" />
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="stepper">
      <DemoSection
        title="Size variants"
        description="Preview the Stepper across all supported sizes using the default linear, non-clickable behavior."
        demo={SizeVariants}
      />

      <DemoSection
        title="Linear Checkout"
        description="Enable clicking while still only allowing the next available step to be selected."
        demo={LinearCheckout}
      />

      <DemoSection
        title="Clickable vs read-only"
        description="Compare the default read-only mode with explicit click-enabled interaction."
        demo={ClickableVsReadOnly}
      />

      <DemoSection
        title="Controlled + Non-linear"
        description="Manage the active step externally and allow jumping to any step."
        demo={ControlledNonLinear}
      />

      <DemoSection
        title="Vertical"
        description="Render the stepper vertically as a read-only progress indicator."
        demo={Vertical}
      />
    </DemoPage>
  )
}
