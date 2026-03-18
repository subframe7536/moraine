import { createSignal } from 'solid-js'

import { Button, Progress } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const STEPS = ['Queued', 'Building', 'Deploying', 'Done']

export default () => {
  const [value, setValue] = createSignal(35)

  const increment = () => {
    setValue((current) => Math.min(current + 10, 100))
  }

  const reset = () => {
    setValue(0)
  }

  return (
    <DemoPage componentKey="progress">
      <DemoSection
        title="Determinate"
        description="Standard progress bar with status text and custom status renderer."
      >
        <div class="max-w-xl space-y-3">
          <Progress
            value={value()}
            status
            renderStatus={({ percent }) => `Completed ${percent}%`}
          />
          <div class="flex gap-2">
            <Button size="sm" variant="outline" onclick={increment}>
              +10%
            </Button>
            <Button size="sm" variant="ghost" onclick={reset}>
              Reset
            </Button>
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Step Mode" description="String-array max renders named steps.">
        <Progress value={2} max={STEPS} color="secondary" />
      </DemoSection>

      <DemoSection
        title="Vertical + Indeterminate"
        description="Vertical orientation and unknown-progress loading state."
      >
        <div class="flex gap-10 items-end">
          <div class="h-44">
            <Progress value={45} orientation="vertical" status animation="swing" />
          </div>
          <div class="h-44">
            <Progress value={null} orientation="vertical" color="neutral" />
          </div>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
