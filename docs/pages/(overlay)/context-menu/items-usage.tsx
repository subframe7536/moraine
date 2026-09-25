import { ContextMenu } from '@src'

export function ItemsUsage() {
  return (
    <div class="max-w-md w-full">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="text-muted-foreground b-(1 border) flex h-28 w-full select-none items-center justify-center text-xs rounded-xl"
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
                { label: 'Delete', icon: 'i-lucide:trash-2', variant: 'destructive' },
              ],
            },
          ]}
        />
      </ContextMenu>
    </div>
  )
}
