import { Button, Tooltip } from '@src'

export function HintsUsage() {
  return (
    <div class="flex gap-4 items-center">
      <Tooltip>
        <Tooltip.Trigger as={Button} variant="outline">
          Deploy History
        </Tooltip.Trigger>
        <Tooltip.Content text="View project deployment history and logs" />
      </Tooltip>
    </div>
  )
}
