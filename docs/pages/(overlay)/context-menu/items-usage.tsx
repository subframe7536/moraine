import { ContextMenu } from '@src'

const FILE_ACTIONS = [
  {
    label: 'Actions',
    items: [
      { label: 'Copy path', leading: 'i-lucide:copy' },
      { label: 'Rename file', leading: 'i-lucide:edit-2' },
      { label: 'Delete', leading: 'i-lucide:trash-2', destructive: true },
    ],
  },
]

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
        <ContextMenu.Content items={FILE_ACTIONS} />
      </ContextMenu>
    </div>
  )
}
