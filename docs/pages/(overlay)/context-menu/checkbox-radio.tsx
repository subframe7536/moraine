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
      <ContextMenu items={items()}>
        {(triggerProps) => (
          <div
            {...triggerProps}
            class="text-sm text-muted-foreground border border-border rounded-lg border-dashed flex h-28 max-w-sm select-none items-center justify-center"
          >
            Right click to change options
          </div>
        )}
      </ContextMenu>
      <p class="text-sm text-muted-foreground">
        Pinned: {String(pinned())}; priority: {priority()}
      </p>
    </div>
  )
}
