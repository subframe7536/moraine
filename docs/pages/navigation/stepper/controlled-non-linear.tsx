import { Button, Stepper } from '@src'
import { createSignal } from 'solid-js'

export function ControlledNonLinear() {
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
