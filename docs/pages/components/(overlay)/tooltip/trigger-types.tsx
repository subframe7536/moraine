import { Button, Tooltip } from '@src'

export function TriggerTypes() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip>
        <Tooltip.Trigger as={Button}>Hover me</Tooltip.Trigger>
        <Tooltip.Content text="Button trigger" />
      </Tooltip>
      <p class="text-sm text-foreground">
        Hover over this{' '}
        <Tooltip>
          <Tooltip.Trigger as="span" class="font-medium underline cursor-help">
            underlined text
          </Tooltip.Trigger>
          <Tooltip.Content text="Inline tooltip" />
        </Tooltip>{' '}
        to see a tooltip.
      </p>
    </div>
  )
}
