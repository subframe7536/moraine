import { Progress } from '@src'
export function Orientation() {
  return (
    <div class="flex gap-8 items-end">
      <div class="max-w-md w-full">
        <Progress label="Disk usage" value={72} valueLabel orientation="horizontal" />
      </div>
      <Progress value={72} orientation="vertical" aria-label="Battery level" />
    </div>
  )
}
