import { ContextMenu } from '@src'

export function ItemsUsage() {
  return (
    <div class="max-w-md w-full">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="text-xs text-muted-foreground b-(1 border) rounded-xl flex h-28 w-full select-none items-center justify-center"
        >
          Right-click to view item model actions
        </ContextMenu.Trigger>
        <ContextMenu.Content
          items={[
            {
              label: 'Actions',
              children: [
                { label: 'Copy path', icon: 'i-lucide:copy' },
                { label: 'Rename file', icon: 'i-lucide:edit-2' },
                { label: 'Delete', icon: 'i-lucide:trash-2', color: 'destructive' },
              ],
            },
          ]}
        />
      </ContextMenu>
    </div>
  )
}
