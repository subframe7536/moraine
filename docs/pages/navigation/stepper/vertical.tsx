import { Stepper } from '@src'

export function Vertical() {
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
