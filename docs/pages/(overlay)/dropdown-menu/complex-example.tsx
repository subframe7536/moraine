import { Avatar, Button, DropdownMenu } from '@src'
import { createSignal } from 'solid-js'

export function ComplexExample() {
  const [theme, setTheme] = createSignal('system')
  const [notifications, setNotifications] = createSignal(true)
  const [compact, setCompact] = createSignal(false)

  return (
    <div class="p-6 flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenu.Trigger as={Button} variant="outline" class="px-3 py-1.5 gap-2.5 h-auto">
          <Avatar text="SC" size="sm" />
          <div class="text-start flex flex-col">
            <span class="text-xs leading-tight font-semibold">Sophia Chen</span>
            <span class="text-[10px] text-muted-foreground leading-tight">Acme Engineering</span>
          </div>
          <span class="i-lucide:chevrons-up-down text-muted-foreground ms-1 size-3.5" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          class="w-64"
          contentTop={({ sub }) =>
            !sub && (
              <div class="px-2.5 py-2 border-b border-border/60 flex gap-2.5 items-center">
                <Avatar text="SC" size="sm" />
                <div class="flex flex-col min-w-0">
                  <span class="text-xs text-foreground font-semibold truncate">Sophia Chen</span>
                  <span class="text-[11px] text-muted-foreground truncate">sophia@acme.inc</span>
                </div>
              </div>
            )
          }
          items={[
            {
              icon: 'i-lucide:user',
              label: 'Profile',
              kbds: ['⇧', '⌘', 'P'],
            },
            {
              icon: 'i-lucide:credit-card',
              label: 'Billing',
              kbds: ['⌘', 'B'],
            },
            {
              icon: 'i-lucide:settings',
              label: 'Settings',
              kbds: ['⌘', 'S'],
            },
            { type: 'separator' },
            {
              icon: 'i-lucide:palette',
              label: 'Theme',
              children: [
                {
                  type: 'radio',
                  group: 'theme',
                  value: 'light',
                  label: 'Light',
                  icon: 'i-lucide:sun',
                  checked: theme() === 'light',
                  onSelect: () => setTheme('light'),
                },
                {
                  type: 'radio',
                  group: 'theme',
                  value: 'dark',
                  label: 'Dark',
                  icon: 'i-lucide:moon',
                  checked: theme() === 'dark',
                  onSelect: () => setTheme('dark'),
                },
                {
                  type: 'radio',
                  group: 'theme',
                  value: 'system',
                  label: 'System',
                  icon: 'i-lucide:laptop',
                  checked: theme() === 'system',
                  onSelect: () => setTheme('system'),
                },
              ],
            },
            {
              type: 'checkbox',
              icon: 'i-lucide:bell',
              label: 'Notifications',
              checked: notifications(),
              onSelect: () => setNotifications((prev) => !prev),
            },
            {
              type: 'checkbox',
              icon: 'i-lucide:minimize-2',
              label: 'Compact Mode',
              checked: compact(),
              onSelect: () => setCompact((prev) => !prev),
            },
            { type: 'separator' },
            {
              icon: 'i-lucide:users',
              label: 'Team',
              children: [
                {
                  icon: 'i-lucide:check',
                  label: 'Engineering',
                },
                {
                  label: 'Product Design',
                },
                {
                  label: 'Marketing Ops',
                },
              ],
            },
            {
              icon: 'i-lucide:keyboard',
              label: 'Keyboard Shortcuts',
              kbds: ['?'],
            },
            { type: 'separator' },
            {
              icon: 'i-lucide:log-out',
              label: 'Log out',
              color: 'destructive',
              kbds: ['⌥', '⇧', 'Q'],
            },
          ]}
        />
      </DropdownMenu>
    </div>
  )
}
