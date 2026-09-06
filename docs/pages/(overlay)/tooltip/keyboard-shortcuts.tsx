import { Button, Tooltip } from '@src'

export function KeyboardShortcuts() {
  return (
    <div class="p-2 b-(1 border) rounded-xl bg-card flex flex-wrap gap-2 items-center">
      <Tooltip open>
        <Tooltip.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:save">
          Save
        </Tooltip.Trigger>
        <Tooltip.Content text="Save changes" kbds={['⌘', 'S']} />
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger
          as={Button}
          variant="ghost"
          size="sm"
          leading="i-lucide:bold"
          aria-label="Bold"
        />
        <Tooltip.Content text="Bold formatting" kbds={['⌘', 'B']} />
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger
          as={Button}
          variant="ghost"
          size="sm"
          leading="i-lucide:italic"
          aria-label="Italic"
        />
        <Tooltip.Content text="Italic formatting" kbds={['⌘', 'I']} />
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger
          as={Button}
          variant="ghost"
          size="sm"
          leading="i-lucide:code"
          aria-label="Code"
        />
        <Tooltip.Content text="Insert Code Block" kbds={['⌘', 'E']} />
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger
          as={Button}
          variant="ghost"
          size="sm"
          leading="i-lucide:search"
          aria-label="Search"
        />
        <Tooltip.Content text="Quick Search" kbds={['⌘', 'K']} />
      </Tooltip>
    </div>
  )
}
