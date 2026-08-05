import { Button, Tooltip } from '@src'

export function TriggerTypes() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip text="Button trigger">{(props) => <Button {...props}>Hover me</Button>}</Tooltip>
      <p class="text-sm text-foreground">
        Hover over this{' '}
        <Tooltip text="Inline tooltip">
          {(props) => (
            <span {...props} class="font-medium underline cursor-help">
              underlined text
            </span>
          )}
        </Tooltip>{' '}
        to see a tooltip.
      </p>
    </div>
  )
}
