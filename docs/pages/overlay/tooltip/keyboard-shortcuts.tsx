import { Button, Tooltip } from '@src'

export function KeyboardShortcuts() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip text="Save" kbds={['Ctrl', 'S']} open>
        {(props) => (
          <Button {...props} variant="outline" leading="i-lucide-save">
            Save
          </Button>
        )}
      </Tooltip>
      <Tooltip text="Undo" kbds={['Ctrl', 'Z']}>
        {(props) => (
          <Button {...props} variant="outline" leading="i-lucide-undo">
            Undo
          </Button>
        )}
      </Tooltip>
      <Tooltip text="Search" kbds={['Ctrl', 'K']}>
        {(props) => (
          <Button {...props} variant="outline" leading="i-lucide-search">
            Search
          </Button>
        )}
      </Tooltip>
    </div>
  )
}
