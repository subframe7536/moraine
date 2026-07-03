import { Button, CommandPalette, Kbd, Popup } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal, onCleanup, onMount } from 'solid-js'

export function Usage() {
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

  const [paletteOpen, setPaletteOpen] = createSignal(false)

  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    onCleanup(() => window.removeEventListener('keydown', handler))
  })

  return (
    <Popup
      open={paletteOpen()}
      onOpenChange={setPaletteOpen}
      content={
        <CommandPalette
          items={BASIC_GROUPS}
          close
          onClose={() => setPaletteOpen(false)}
          footer={
            <div class="flex gap-4 items-center justify-between">
              <div class="flex flex-wrap gap-3 items-center">
                <div class="flex gap-2 items-center">
                  <Kbd value={['↑', '↓']} />
                  <span>Navigate</span>
                </div>
                <div class="flex gap-2 items-center">
                  <Kbd value={['↵']} />
                  <span>Open</span>
                </div>
              </div>
              <div class="flex gap-2 items-center">
                <Kbd value={['Esc']} />
                <span>Close</span>
              </div>
            </div>
          }
        />
      }
      classes={{ content: 'top-1/4 translate-y-0 w-lg max-w-[calc(100vw-2rem)]' }}
    >
      <Button variant="outline" trailing={<Kbd value={['⌘', 'K']} />}>
        Search...
      </Button>
    </Popup>
  )
}
