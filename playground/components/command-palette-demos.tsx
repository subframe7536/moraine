import { createSignal, onCleanup, onMount } from 'solid-js'

import { Button, CommandPalette, Kbd, Popup } from '../../src'
import type { CommandPaletteGroup } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const BASIC_GROUPS: CommandPaletteGroup[] = [
  {
    id: 'actions',
    label: 'Actions',
    items: [
      { value: 'new-file', label: 'New File', icon: 'i-lucide-file-plus', kbds: ['⌘', 'N'] },
      { value: 'open-file', label: 'Open File', icon: 'i-lucide-folder-open', kbds: ['⌘', 'O'] },
      { value: 'save', label: 'Save', icon: 'i-lucide-save', kbds: ['⌘', 'S'] },
      {
        value: 'export-pdf',
        label: 'Export as PDF',
        icon: 'i-lucide-file-text',
        description: 'Export current document to PDF',
      },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    items: [
      { value: 'dashboard', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
      { value: 'settings', label: 'Settings', icon: 'i-lucide-settings', suffix: 'Preferences' },
      { value: 'profile', label: 'Profile', icon: 'i-lucide-user', disabled: true },
      { value: 'setting', label: 'Setting1', icon: 'i-lucide-settings', suffix: 'Preferences' },
      { value: 'setting', label: 'Setting2', icon: 'i-lucide-settings', suffix: 'Preferences' },
      { value: 'setting', label: 'Setting3', icon: 'i-lucide-settings', suffix: 'Preferences' },
      { value: 'setting', label: 'Setting3', icon: 'i-lucide-settings', suffix: 'Preferences' },
      { value: 'setting', label: 'Setting3', icon: 'i-lucide-settings', suffix: 'Preferences' },
      { value: 'setting', label: 'Setting3', icon: 'i-lucide-settings', suffix: 'Preferences' },
      { value: 'setting', label: 'Setting3', icon: 'i-lucide-settings', suffix: 'Preferences' },
      { value: 'setting', label: 'Setting10', icon: 'i-lucide-settings', suffix: 'Preferences' },
    ],
  },
]

const SUB_NAV_GROUPS: CommandPaletteGroup[] = [
  {
    id: 'main',
    label: 'Commands',
    items: [
      {
        value: 'create',
        label: 'Create',
        icon: 'i-lucide-plus-circle',
        description: 'Create new resources',
        children: [
          { value: 'create-new-file', label: 'New File', icon: 'i-lucide-file-plus' },
          { value: 'create-new-folder', label: 'New Folder', icon: 'i-lucide-folder-plus' },
          { value: 'create-new-project', label: 'New Project', icon: 'i-lucide-git-branch' },
        ],
      },
      {
        value: 'share',
        label: 'Share',
        icon: 'i-lucide-share-2',
        description: 'Share with others',
        children: [
          { value: 'share-copy-link', label: 'Copy Link', icon: 'i-lucide-link', kbds: ['⌘', 'L'] },
          { value: 'share-send-email', label: 'Send via Email', icon: 'i-lucide-mail' },
        ],
      },
      { value: 'delete', label: 'Delete', icon: 'i-lucide-trash-2' },
    ],
  },
]

export function CommandPaletteDemos() {
  const [closeCount, setCloseCount] = createSignal(0)
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
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Command Palette"
      description="An inline, searchable command palette built on Kobalte Combobox."
    >
      <DemoSection
        title="Usage"
        description="Click the button or press ⌘K to open the command palette."
      >
        <Popup
          open={paletteOpen()}
          onOpenChange={setPaletteOpen}
          content={
            <CommandPalette
              groups={BASIC_GROUPS}
              close
              onClose={() => setPaletteOpen(false)}
              footer={
                <div class="text-xs flex gap-4 items-center justify-between">
                  <div class="flex gap-4 items-center">
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
          classes={{ content: 'top-1/4 translate-y-0' }}
        >
          <Button variant="outline" trailing={<Kbd value={['⌘', 'K']} />}>
            Search...
          </Button>
        </Popup>
      </DemoSection>

      <DemoSection title="Basic" description="Groups of items with icons, kbds, and descriptions.">
        <div class="border rounded-lg max-w-lg shadow-lg overflow-hidden">
          <CommandPalette groups={BASIC_GROUPS} />
        </div>
      </DemoSection>

      <DemoSection
        title="Sub-navigation"
        description="Items with children drill into a sub-group. Press Backspace or the back button to return."
      >
        <div class="border rounded-lg max-w-lg shadow-lg overflow-hidden">
          <CommandPalette groups={SUB_NAV_GROUPS} />
        </div>
      </DemoSection>

      <DemoSection
        title="With Close Button"
        description="A close button in the input trailing slot."
      >
        <div class="border rounded-lg max-w-lg shadow-lg overflow-hidden">
          <CommandPalette groups={BASIC_GROUPS} close onClose={() => setCloseCount((c) => c + 1)} />
        </div>
        <p class="text-sm text-muted-foreground mt-2">Close clicked: {closeCount()} time(s)</p>
      </DemoSection>

      <DemoSection title="Loading" description="Search icon becomes a spinner while loading.">
        <div class="border rounded-lg max-w-lg shadow-lg overflow-hidden">
          <CommandPalette groups={BASIC_GROUPS} loading />
        </div>
      </DemoSection>

      <DemoSection
        title="Custom empty state"
        description="Override the default 'No results.' message."
      >
        <div class="border rounded-lg max-w-lg shadow-lg overflow-hidden">
          <CommandPalette
            groups={[]}
            empty={
              <span class="flex flex-col gap-1 items-center">
                <span>Nothing here yet.</span>
                <span class="text-xs">Try a different search term.</span>
              </span>
            }
          />
        </div>
      </DemoSection>
    </DemoPage>
  )
}
