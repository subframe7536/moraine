import { Button, Tooltip } from '@src'

export function ShortcutsUsage() {
  return (
    <div class="flex gap-4 items-center">
      <Tooltip>
        <Tooltip.Trigger as={Button} leading="i-lucide:save">
          Save
        </Tooltip.Trigger>
        <Tooltip.Content text="Save changes" kbds={['command', 's']} />
      </Tooltip>
    </div>
  )
}
