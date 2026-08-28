import { Button, Popover } from '@src'

export function TriggerModes() {
  return (
    <div class="flex gap-4 items-center">
      <Popover content={<div class="text-xs p-3">Opened via default click mode.</div>}>
        {(props) => (
          <Button {...props} variant="outline">
            Click Trigger
          </Button>
        )}
      </Popover>

      <Popover mode="hover" content={<div class="text-xs p-3">Opened via pointer hover mode.</div>}>
        {(props) => (
          <Button {...props} variant="outline">
            Hover Trigger
          </Button>
        )}
      </Popover>
    </div>
  )
}
