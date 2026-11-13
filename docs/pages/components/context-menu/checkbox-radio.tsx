import { ContextMenu } from '@src'
import type { ContextMenuT } from '@src'
import { createMemo, createSignal } from 'solid-js'

export function CheckboxRadio() {
  const [pinned, setPinned] = createSignal(false)
  const [priority, setPriority] = createSignal('normal')
  const items = createMemo<ContextMenuT.Item[]>(() => [
    { type: 'checkbox', label: 'Pin item', checked: pinned(), onCheckedChange: setPinned },
    { type: 'separator' },
    {
      type: 'radio-group',
      value: priority(),
      onValueChange: setPriority,
      items: [
        { type: 'radio', label: 'Low priority', value: 'low' },
        { type: 'radio', label: 'Normal priority', value: 'normal' },
        { type: 'radio', label: 'High priority', value: 'high' },
      ],
    },
  ])

  return (
    <div class="space-y-3">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="text-sm text-muted-foreground border border-border rounded-lg border-dashed flex h-28 max-w-sm select-none items-center justify-center"
        >
          Right click to change options
        </ContextMenu.Trigger>
        <ContextMenu.Content items={items()} />
      </ContextMenu>
      <p class="text-sm text-muted-foreground">
        Pinned: {String(pinned())}; priority: {priority()}
      </p>
    </div>
  )
}
