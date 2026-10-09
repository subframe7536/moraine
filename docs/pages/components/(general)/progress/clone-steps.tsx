import { Button, Progress } from '@src'
import { createSignal } from 'solid-js'

const STEPS = ['Waiting', 'Cloning', 'Installing', 'Done']

export function CloneSteps() {
  const [step, setStep] = createSignal(1)

  return (
    <div class="max-w-md w-full space-y-3">
      <Progress value={step()} max={STEPS} status aria-label="Clone repository" />
      <div class="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={step() === 0}
          onClick={() => setStep((current) => current - 1)}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={step() >= STEPS.length - 1}
          onClick={() => setStep((current) => current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
