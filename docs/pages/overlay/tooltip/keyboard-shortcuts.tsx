import { Button, Tooltip } from '@src'

export function KeyboardShortcuts() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip text="Save" kbds={['Ctrl', 'S']} open>
        <Button variant="outline" leading={<div class="i-lucide-save" />}>
          Save
        </Button>
      </Tooltip>
      <Tooltip text="Undo" kbds={['Ctrl', 'Z']}>
        <Button variant="outline" leading={<div class="i-lucide-undo" />}>
          Undo
        </Button>
      </Tooltip>
      <Tooltip text="Search" kbds={['Ctrl', 'K']}>
        <Button variant="outline" leading={<div class="i-lucide-search" />}>
          Search
        </Button>
      </Tooltip>
    </div>
  )
}
