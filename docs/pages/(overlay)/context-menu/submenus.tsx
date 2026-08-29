import { ContextMenu } from '@src'

export function Submenus() {
  return (
    <ContextMenu
      items={[
        {
          label: 'Sort by',
          children: [
            {
              type: 'group',
              children: [
                { label: 'Name', icon: 'i-lucide:arrow-down-a-z' },
                { label: 'Modified date', icon: 'i-lucide:calendar-arrow-down' },
              ],
            },
          ],
        },
        { label: 'Refresh', icon: 'i-lucide:refresh-cw' },
      ]}
    >
      {(triggerProps) => (
        <div
          {...triggerProps}
          class="text-sm text-muted-foreground border border-border rounded-lg border-dashed flex h-28 max-w-sm select-none items-center justify-center"
        >
          Right click for a submenu
        </div>
      )}
    </ContextMenu>
  )
}
