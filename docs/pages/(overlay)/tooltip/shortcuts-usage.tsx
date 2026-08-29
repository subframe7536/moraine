import { Button, Tooltip } from '@src'

export function ShortcutsUsage() {
  return (
    <div class="flex gap-4 items-center">
      <Tooltip text="Save changes" kbds={['command', 's']}>
        {(props) => (
          <Button {...props} leading="i-lucide:save">
            Save
          </Button>
        )}
      </Tooltip>
    </div>
  )
}
