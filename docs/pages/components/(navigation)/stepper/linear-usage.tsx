import { Button, Stepper } from '@src'
import { createSignal } from 'solid-js'

const STEPS = [
  { value: 'account', title: 'Account', description: 'User credentials' },
  { value: 'profile', title: 'Profile', description: 'Personal details' },
  { value: 'review', title: 'Review', description: 'Confirmation' },
]

export function LinearUsage() {
  const [step, setStep] = createSignal('account')
  const stepKeys = ['account', 'profile', 'review']

  const currentIndex = () => stepKeys.indexOf(step())

  const goPrev = () => {
    const prevKey = stepKeys[Math.max(0, currentIndex() - 1)]
    if (prevKey) {
      setStep(prevKey)
    }
  }

  const goNext = () => {
    const nextKey = stepKeys[Math.min(stepKeys.length - 1, currentIndex() + 1)]
    if (nextKey) {
      setStep(nextKey)
    }
  }

  return (
    <div class="max-w-xl w-full space-y-4">
      <Stepper items={STEPS} value={step()} onChange={setStep} linear />
      <div class="flex gap-2">
        <Button size="xs" variant="outline" disabled={currentIndex() === 0} onClick={goPrev}>
          Previous
        </Button>
        <Button size="xs" disabled={currentIndex() === stepKeys.length - 1} onClick={goNext}>
          Next step
        </Button>
      </div>
    </div>
  )
}
