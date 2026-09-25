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
      type: 'radio',
      label: 'Low priority',
      group: 'priority',
      value: 'low',
      checked: priority() === 'low',
      onValueChange: setPriority,
    },
    {
      type: 'radio',
      label: 'Normal priority',
      group: 'priority',
      value: 'normal',
      checked: priority() === 'normal',
      onValueChange: setPriority,
    },
    {
      type: 'radio',
      label: 'High priority',
      group: 'priority',
      value: 'high',
      checked: priority() === 'high',
      onValueChange: setPriority,
    },
  ])

  return (
    <div class="space-y-3">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="text-muted-foreground border border-border border-dashed flex h-28 max-w-sm select-none items-center justify-center text-sm rounded-lg"
        >
          Right click to change options
        </ContextMenu.Trigger>
        <ContextMenu.Content items={items()} />
      </ContextMenu>
      <p class="text-muted-foreground text-sm">
        Pinned: {String(pinned())}; priority: {priority()}
      </p>
    </div>
  )
}
