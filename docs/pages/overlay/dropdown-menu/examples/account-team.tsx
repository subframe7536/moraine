import { Button, DropdownMenu } from '@src'
import { createSignal } from 'solid-js'

export function AccountTeam() {
  const badgeClass =
    'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

  const avatarClass =
    'grid size-4 place-items-center rounded-full bg-linear-to-br from-primary to-accent text-[10px] font-semibold text-primary-foreground'

  const [lastAction, setLastAction] = createSignal('None')

  return (
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <DropdownMenu
        items={[
          {
            type: 'group',
            label: 'Account',
            children: [
              {
                label: (
                  <div class="flex gap-2 items-center">
                    <span class="font-medium">Alex Morgan</span>
                    <span class={badgeClass}>Owner</span>
                  </div>
                ),
                description: 'alex@moraine.dev',
                icon: <span class={avatarClass}>AM</span>,
                onSelect: () => setLastAction('Open account profile'),
              },
              { type: 'separator' },
              {
                label: 'Switch Workspace',
                icon: 'i-lucide-building-2',
                children: [
                  {
                    type: 'group',
                    label: 'Recent Workspaces',
                    children: [
                      {
                        label: 'Design System',
                        description: '12 teammates · shared tokens',
                        icon: 'i-lucide-palette',
                        onSelect: () => setLastAction('Switch to Design System'),
                      },
                      {
                        label: 'Platform Ops',
                        description: '8 teammates · deploy tooling',
                        icon: 'i-lucide-server',
                        onSelect: () => setLastAction('Switch to Platform Ops'),
                      },
                      {
                        label: 'Support Workspace',
                        description: '5 teammates · customer issues',
                        icon: 'i-lucide-life-buoy',
                        onSelect: () => setLastAction('Switch to Support Workspace'),
                      },
                    ],
                  },
                  {
                    type: 'group',
                    label: 'Actions',
                    children: [
                      {
                        label: 'Create Workspace',
                        icon: 'i-lucide-plus',
                        onSelect: () => setLastAction('Create workspace'),
                      },
                    ],
                  },
                ],
              },
              {
                label: 'Invite Teammates',
                icon: 'i-lucide-user-plus',
                kbds: ['⌘', 'I'],
                onSelect: () => setLastAction('Invite teammates'),
              },
              {
                label: 'Billing & Usage',
                icon: 'i-lucide-credit-card',
                onSelect: () => setLastAction('Billing & usage'),
              },
            ],
          },
          {
            type: 'group',
            label: 'Preferences',
            children: [
              {
                label: 'Account Settings',
                icon: 'i-lucide-settings-2',
                kbds: ['⌘', ','],
                onSelect: () => setLastAction('Account settings'),
              },
              {
                label: 'Keyboard Shortcuts',
                icon: 'i-lucide-command',
                kbds: ['⌘', 'K'],
                onSelect: () => setLastAction('Keyboard shortcuts'),
              },
              {
                label: 'Support Inbox',
                icon: 'i-lucide-life-buoy',
                onSelect: () => setLastAction('Support inbox'),
              },
            ],
          },
          {
            type: 'group',
            children: [
              {
                label: 'Sign Out',
                icon: 'i-lucide-log-out',
                color: 'destructive',
                onSelect: () => setLastAction('Sign out'),
              },
            ],
          },
        ]}
      >
        <Button variant="outline">Open account menu</Button>
      </DropdownMenu>
      <p class="text-sm text-muted-foreground">
        Last action: <span class="font-medium">{lastAction()}</span>
      </p>
    </div>
  )
}
