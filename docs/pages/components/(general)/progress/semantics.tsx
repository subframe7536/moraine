import { Progress } from '@src'

export function Semantics() {
  return (
    <div class="max-w-md w-full">
      <Progress
        label="Downloading installation bundle"
        value={82}
        showValue
        aria-label="Downloading installation bundle"
      />
    </div>
  )
}
