import { Button, CommandPalette, Kbd } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal, onCleanup, onMount } from 'solid-js'

const GROUPS: CommandPaletteT.Group[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { value: 'new-issue', label: 'New Issue', icon: 'i-lucide-circle-plus', kbds: ['⌘', 'N'] },
      { value: 'open-inbox', label: 'Open Inbox', icon: 'i-lucide-inbox', kbds: ['G', 'I'] },
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
    items: [
      { value: 'go-dashboard', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
      { value: 'go-projects', label: 'Projects', icon: 'i-lucide-folder-kanban' },
      {
        value: 'go-settings',
        label: 'Settings',
        icon: 'i-lucide-settings',
        description: 'Preferences',
      },
      { value: 'go-billing', label: 'Billing', icon: 'i-lucide-credit-card', disabled: true },
    ],
  },
]

export function Usage() {
  const [open, setOpen] = createSignal(false)

  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    onCleanup(() => window.removeEventListener('keydown', handler))
  })

  return (
    <CommandPalette
      open={open()}
      onOpenChange={setOpen}
      groups={GROUPS}
      showClose
      onClose={() => setOpen(false)}
      footerRender={() => (
        <div class="flex gap-4 items-center justify-between">
          <div class="flex flex-wrap gap-3 items-center">
            <div class="flex gap-2 items-center">
              <Kbd value={['↑', '↓']} />
              <span class="text-xs">Navigate</span>
            </div>
            <div class="flex gap-2 items-center">
              <Kbd value={['↵']} />
              <span class="text-xs">Open</span>
            </div>
          </div>
          <div class="flex gap-2 items-center">
            <Kbd value={['Esc']} />
            <span class="text-xs">Close</span>
          </div>
        </div>
      )}
    >
      <Button variant="outline" trailing={<Kbd value={['⌘', 'K']} />}>
        Search...
      </Button>
    </CommandPalette>
  )
}
