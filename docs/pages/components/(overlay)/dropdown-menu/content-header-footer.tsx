import { Button, DropdownMenu } from '@src'

export function ContentHeaderFooter() {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger as={Button} variant="outline">
        Workspace
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        topRender={
          <div class="text-xs px-2 py-1.5 border-b border-border">
            <p class="font-medium">Acme Corp</p>
            <p class="text-muted-foreground">acme@example.com</p>
          </div>
        }
        bottomRender={
          <div class="text-[11px] text-muted-foreground px-2 py-1 border-t border-border flex justify-between">
            <span>Moraine UI</span>
            <span>Free Plan</span>
          </div>
        }
        items={[
          { label: 'Settings', icon: 'i-lucide:settings' },
          { label: 'Team members', icon: 'i-lucide:users' },
          { type: 'separator' },
          { label: 'Log out', icon: 'i-lucide:log-out' },
        ]}
      />
    </DropdownMenu>
  )
}
