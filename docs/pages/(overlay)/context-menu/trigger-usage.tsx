import { ContextMenu } from '@src'

const MENU_ITEMS = [
  { label: 'Back', leading: 'i-lucide:arrow-left' },
  { label: 'Forward', leading: 'i-lucide:arrow-right', disabled: true },
  { label: 'Reload', leading: 'i-lucide:rotate-cw' },
]

export function TriggerUsage() {
  return (
    <div class="max-w-md w-full">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="text-xs text-muted-foreground b-(2 border dashed) rounded-xl flex h-32 w-full select-none items-center justify-center"
        >
          Right-click or long-press inside this area
        </ContextMenu.Trigger>
        <ContextMenu.Content items={MENU_ITEMS} />
      </ContextMenu>
    </div>
  )
}
