import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'
import { createMemo, createSignal } from 'solid-js'

export function CheckboxRadio() {
  const [showArchived, setShowArchived] = createSignal(false)
  const [layout, setLayout] = createSignal('grid')
  const items = createMemo<DropdownMenuT.Item[]>(() => [
    {
      type: 'checkbox',
      label: 'Show archived',
      checked: showArchived(),
      onCheckedChange: setShowArchived,
    },
    { type: 'separator' },
    {
      type: 'radio',
      label: 'Grid',
      group: 'layout',
      value: 'grid',
      checked: layout() === 'grid',
      onValueChange: setLayout,
    },
    {
      type: 'radio',
      label: 'List',
      group: 'layout',
      value: 'list',
      checked: layout() === 'list',
      onValueChange: setLayout,
    },
  ])

  return (
    <div class="flex gap-3 items-center">
      <DropdownMenu>
        <DropdownMenu.Trigger as={Button} variant="outline">
          View options
        </DropdownMenu.Trigger>
        <DropdownMenu.Content items={items()} />
      </DropdownMenu>
      <p class="text-sm text-muted-foreground">
        {layout()} layout, archived: {String(showArchived())}
      </p>
    </div>
  )
}
