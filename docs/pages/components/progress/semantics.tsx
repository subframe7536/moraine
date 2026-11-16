import { Progress } from '@src'

export function Semantics() {
  return (
    <div class="max-w-md w-full">
      <Progress
        textLabel="Downloading installation bundle"
        value={82}
        valueLabel
        aria-textLabel="Downloading installation bundle"
      />
    </div>
  )
}
