import { ContextMenu } from '@src'
import type { ContextMenuT } from '@src'

export interface ContextMenuPlaygroundProps {
  size?: ContextMenuT.Variant['size']
  disabled?: boolean
}

export function ContextMenuPlayground(props: ContextMenuPlaygroundProps) {
  return (
    <ContextMenu
      items={[
        {
          type: 'group',
          label: 'Edit',
          children: [
            { label: 'Cut', icon: 'i-lucide:scissors', kbds: ['⌘', 'X'] },
            { label: 'Copy', icon: 'i-lucide:copy', kbds: ['⌘', 'C'] },
            { label: 'Paste', icon: 'i-lucide:clipboard', kbds: ['⌘', 'V'] },
          ],
        },
        {
          type: 'group',
          children: [{ label: 'Delete', icon: 'i-lucide:trash-2', color: 'destructive' }],
        },
      ]}
      size={props.size ?? 'md'}
      disabled={props.disabled ?? false}
    >
      {(triggerProps) => (
        <div
          {...triggerProps}
          class="text-xs text-muted-foreground border border-border/60 rounded-xl border-dashed bg-muted/20 flex h-36 max-w-full w-80 select-none items-center justify-center"
        >
          Right click or long press here
        </div>
      )}
    </ContextMenu>
  )
}
