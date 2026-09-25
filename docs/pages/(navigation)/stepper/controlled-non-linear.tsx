import { Button, Stepper } from '@src'
import { createSignal } from 'solid-js'

export function ControlledNonLinear() {
  const RELEASE_STEPS = () => [
    {
      title: 'Draft',
      value: 'draft',
      content: <p class="text-foreground text-sm">Prepare release notes.</p>,
    },
    {
      title: 'Review',
      value: 'review',
      content: <p class="text-foreground text-sm">Collect team approvals.</p>,
    },
    {
      title: 'Ship',
      value: 'ship',
      content: <p class="text-foreground text-sm">Deploy to production.</p>,
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
        <Button size="sm" variant="outline" onClick={() => setReleaseStep('draft')}>
          Go to draft
        </Button>
        <Button size="sm" variant="outline" onClick={() => setReleaseStep('review')}>
          Go to review
        </Button>
        <Button size="sm" variant="outline" onClick={() => setReleaseStep('ship')}>
          Go to ship
        </Button>
        <p class="text-muted-foreground text-xs">Current step: {releaseStep()}</p>
      </div>
    </div>
  )
}
