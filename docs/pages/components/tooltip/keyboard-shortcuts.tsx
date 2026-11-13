import { Button, Tooltip } from '@src'

export function KeyboardShortcuts() {
  return (
    <div class="p-2 b-1 b-border rounded-xl bg-card flex flex-wrap gap-2 items-center">
      <Tooltip>
        <Tooltip.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:save">
          Save
        </Tooltip.Trigger>
        <Tooltip.Content kbds={['⌘', 'S']}>Save changes</Tooltip.Content>
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger
          as={Button}
          variant="ghost"
          size="sm"
          leading="i-lucide:bold"
          aria-label="Bold"
        />
        <Tooltip.Content kbds={['⌘', 'B']}>Bold formatting</Tooltip.Content>
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger
          as={Button}
          variant="ghost"
          size="sm"
          leading="i-lucide:italic"
          aria-label="Italic"
        />
        <Tooltip.Content kbds={['⌘', 'I']}>Italic formatting</Tooltip.Content>
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger
          as={Button}
          variant="ghost"
          size="sm"
          leading="i-lucide:code"
          aria-label="Code"
        />
        <Tooltip.Content kbds={['⌘', 'E']}>Insert Code Block</Tooltip.Content>
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger
          as={Button}
          variant="ghost"
          size="sm"
          leading="i-lucide:search"
          aria-label="Search"
        />
        <Tooltip.Content kbds={['⌘', 'K']}>Quick Search</Tooltip.Content>
      </Tooltip>
    </div>
  )
}
