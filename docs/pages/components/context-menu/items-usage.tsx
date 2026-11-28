import { ContextMenu } from '@src'
export function ItemsUsage() {
  return (
    <div class="max-w-md w-full">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="text-xs text-muted-foreground b-1 b-border rounded-xl flex h-28 w-full select-none items-center justify-center"
        >
          Right-click to view grouped file actions
        </ContextMenu.Trigger>
        <ContextMenu.Content
          items={[
            [
              { label: 'Copy path', icon: 'i-lucide:copy' },
              { label: 'Rename file', icon: 'i-lucide:edit-2' },
            ],
            [{ label: 'Delete', icon: 'i-lucide:trash-2', danger: true }],
          ]}
        />
      </ContextMenu>
    </div>
  )
}
