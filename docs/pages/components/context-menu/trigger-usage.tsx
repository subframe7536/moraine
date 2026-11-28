import { ContextMenu } from '@src'
import type { ContextMenuT } from '@src'
const MENU_ITEMS = [
  { label: 'Back', icon: 'i-lucide:arrow-left' },
  { label: 'Forward', icon: 'i-lucide:arrow-right', disabled: true },
  { label: 'Reload', icon: 'i-lucide:rotate-cw' },
] satisfies Array<ContextMenuT.Item>

export function TriggerUsage() {
  return (
    <div class="max-w-md w-full">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="text-xs text-muted-foreground b-2 b-border rounded-xl b-dashed flex h-32 w-full select-none items-center justify-center"
        >
          Right-click or long-press inside this area
        </ContextMenu.Trigger>
        <ContextMenu.Content items={MENU_ITEMS} />
      </ContextMenu>
    </div>
  )
}
