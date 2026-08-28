import { Progress } from '@src'

export function Semantics() {
  return (
    <div class="max-w-md w-full space-y-2">
      <div class="text-xs text-muted-foreground flex justify-between">
        <span>Downloading installation bundle</span>
        <span>82%</span>
      </div>
      <Progress value={82} status aria-label="Downloading installation bundle" />
    </div>
  )
}
