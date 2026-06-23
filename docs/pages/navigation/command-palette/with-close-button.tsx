import { CommandPalette } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal } from 'solid-js'

export function WithCloseButton() {
  const BASIC_GROUPS: CommandPaletteT.Item[] = [
    {
      id: 'workspace',
      label: 'Workspace',
      children: [
        { value: 'new-issue', label: 'New Issue', icon: 'i-lucide-circle-plus', kbds: ['⌘', 'N'] },
        {
          value: 'open-inbox',
          label: 'Open Inbox',
          icon: 'i-lucide-inbox',
          kbds: ['G', 'I'],
        },
        {
          value: 'sync-roadmap',
          label: 'Sync Roadmap',
          icon: 'i-lucide-refresh-cw',
          description: 'Pull the latest planning updates',
        },
      ],
    },
    {
      id: 'navigation',
      label: 'Navigation',
      children: [
        { value: 'go-dashboard', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
        { value: 'go-projects', label: 'Projects', icon: 'i-lucide-folder-kanban' },
        {
          value: 'go-settings',
          label: 'Settings',
          icon: 'i-lucide-settings',
          suffix: 'Preferences',
        },
        { value: 'go-billing', label: 'Billing', icon: 'i-lucide-credit-card', disabled: true },
      ],
    },
  ]

  const [closeCount, setCloseCount] = createSignal(0)

  return (
    <>
      <div class="max-w-full w-lg">
        <CommandPalette items={BASIC_GROUPS} close onClose={() => setCloseCount((c) => c + 1)} />
      </div>
      <p class="text-sm text-muted-foreground mt-2">Close clicked: {closeCount()} time(s)</p>
    </>
  )
}
