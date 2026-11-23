import { Button, Tooltip } from '@src'
export function ShortcutsUsage() {
  return (
    <div class="flex gap-4 items-center">
      <Tooltip kbdVariant="outline">
        <Tooltip.Trigger as={Button} leading="i-lucide:save">
          Save
        </Tooltip.Trigger>
        <Tooltip.Content kbds={['command', 's']}>Save changes</Tooltip.Content>
      </Tooltip>
    </div>
  )
}
