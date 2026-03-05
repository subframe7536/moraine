import { createMemo, createSignal } from 'solid-js'

import { Button, DropdownMenu } from '../../src'
import type { DropdownMenuItems } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

export const DropdownMenuDemos = () => {
  const [lastAction, setLastAction] = createSignal('None')
  const [showStatusBar, setShowStatusBar] = createSignal(true)
  const [showActivityBar, setShowActivityBar] = createSignal(false)
  const [showPanel, setShowPanel] = createSignal(false)
  const [theme, setTheme] = createSignal<'light' | 'dark' | 'system'>('light')

  const basicItems: DropdownMenuItems = [
    [
      { type: 'label', label: 'My Account' },
      {
        label: 'Profile',
        icon: 'i-lucide-user',
        kbds: ['⇧', '⌘', 'P'],
        onSelect: () => setLastAction('Profile'),
      },
      {
        label: 'Billing',
        icon: 'i-lucide-credit-card',
        kbds: ['⌘', 'B'],
        onSelect: () => setLastAction('Billing'),
      },
      {
        label: 'Settings',
        icon: 'i-lucide-settings',
        kbds: ['⌘', 'S'],
        onSelect: () => setLastAction('Settings'),
      },
      { type: 'separator' },
      {
        label: 'Support',
        icon: 'i-lucide-circle-help',
        onSelect: () => setLastAction('Support'),
      },
      {
        label: 'API',
        icon: 'i-lucide-terminal',
        disabled: true,
      },
    ],
  ]

  const submenuItems = createMemo<DropdownMenuItems>(() => [
    [
      { type: 'label', label: 'Workspace' },
      {
        label: 'Team',
        icon: 'i-lucide-users',
        onSelect: () => setLastAction('Team'),
      },
      {
        label: 'Invite users',
        icon: 'i-lucide-user-plus',
        children: [
          [
            {
              label: 'Invite by email',
              icon: 'i-lucide-mail',
              onSelect: () => setLastAction('Invite by email'),
            },
            {
              label: 'Invite by link',
              icon: 'i-lucide-link',
              onSelect: () => setLastAction('Invite by link'),
            },
            { type: 'separator' },
            {
              label: 'Invite from contacts',
              icon: 'i-lucide-address-book',
              onSelect: () => setLastAction('Invite from contacts'),
            },
          ],
        ],
      },
      { type: 'separator' },
      {
        type: 'checkbox',
        label: 'Status Bar',
        icon: 'i-lucide-layout',
        checked: showStatusBar(),
        onCheckedChange: (checked) => setShowStatusBar(checked),
      },
      {
        type: 'checkbox',
        label: 'Activity Bar',
        icon: 'i-lucide-activity',
        checked: showActivityBar(),
        onCheckedChange: (checked) => setShowActivityBar(checked),
      },
      {
        type: 'checkbox',
        label: 'Panel',
        icon: 'i-lucide-panel-left',
        checked: showPanel(),
        onCheckedChange: (checked) => setShowPanel(checked),
      },
    ],
  ])

  const complexItems = createMemo<DropdownMenuItems>(() => [
    [
      { type: 'label', label: 'File' },
      {
        label: 'New File',
        icon: 'i-lucide-file-plus',
        kbds: ['⌘', 'N'],
        onSelect: () => setLastAction('New File'),
      },
      {
        label: 'New Folder',
        icon: 'i-lucide-folder-plus',
        kbds: ['⇧', '⌘', 'N'],
        onSelect: () => setLastAction('New Folder'),
      },
      {
        label: 'Open Recent',
        icon: 'i-lucide-folder-open',
        children: [
          [
            { type: 'label', label: 'Recent Projects' },
            {
              label: 'Project Alpha',
              icon: 'i-lucide-file-code',
              onSelect: () => setLastAction('Project Alpha'),
            },
            {
              label: 'Project Beta',
              icon: 'i-lucide-file-code',
              onSelect: () => setLastAction('Project Beta'),
            },
            {
              label: 'More Projects',
              icon: 'i-lucide-more-horizontal',
              children: [
                [
                  {
                    label: 'Project Gamma',
                    icon: 'i-lucide-file-code',
                    onSelect: () => setLastAction('Project Gamma'),
                  },
                  {
                    label: 'Project Delta',
                    icon: 'i-lucide-file-code',
                    onSelect: () => setLastAction('Project Delta'),
                  },
                ],
              ],
            },
          ],
        ],
      },
      { type: 'separator' },
      {
        label: 'Save',
        icon: 'i-lucide-save',
        kbds: ['⌘', 'S'],
        onSelect: () => setLastAction('Save'),
      },
      {
        label: 'Export',
        icon: 'i-lucide-download',
        kbds: ['⇧', '⌘', 'E'],
        onSelect: () => setLastAction('Export'),
      },
    ],
    [
      { type: 'label', label: 'Theme' },
      {
        label: 'Light',
        icon: theme() === 'light' ? 'i-lucide-check' : 'i-lucide-sun',
        onSelect: () => setTheme('light'),
      },
      {
        label: 'Dark',
        icon: theme() === 'dark' ? 'i-lucide-check' : 'i-lucide-moon',
        onSelect: () => setTheme('dark'),
      },
      {
        label: 'System',
        icon: theme() === 'system' ? 'i-lucide-check' : 'i-lucide-monitor',
        onSelect: () => setTheme('system'),
      },
    ],
    [
      {
        label: 'Delete Project',
        icon: 'i-lucide-trash-2',
        color: 'destructive',
        onSelect: () => setLastAction('Delete Project'),
      },
    ],
  ])

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Dropdown Menu"
      description="Updated from Zaidan patterns: basic, shortcut, submenu, stateful toggles, and complex nested menu."
    >
      <DemoSection
        title="Basic / Icons / Shortcuts"
        description="Account-style dropdown with icons and keyboard shortcut hints."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <DropdownMenu items={basicItems}>
            <Button variant="outline">Open Menu</Button>
          </DropdownMenu>
          <p class="text-sm text-zinc-600">
            Last action: <span class="font-medium">{lastAction()}</span>
          </p>
        </div>
      </DemoSection>

      <DemoSection
        title="Submenu / Checkboxes"
        description="Nested actions plus controlled checkbox rows."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <DropdownMenu items={submenuItems()}>
            <Button variant="outline">Workspace Menu</Button>
          </DropdownMenu>
          <p class="text-sm text-zinc-600">
            Status: <span class="font-medium">{String(showStatusBar())}</span>
          </p>
          <p class="text-sm text-zinc-600">
            Activity: <span class="font-medium">{String(showActivityBar())}</span>
          </p>
          <p class="text-sm text-zinc-600">
            Panel: <span class="font-medium">{String(showPanel())}</span>
          </p>
        </div>
      </DemoSection>

      <DemoSection
        title="Complex"
        description="Multi-group menu with deep nested submenu and theme selection."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <DropdownMenu items={complexItems()}>
            <Button>Complex Menu</Button>
          </DropdownMenu>
          <p class="text-sm text-zinc-600">
            Theme: <span class="font-medium uppercase">{theme()}</span>
          </p>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
