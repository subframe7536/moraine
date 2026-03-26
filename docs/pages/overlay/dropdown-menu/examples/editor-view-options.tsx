import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'
import { createMemo, createSignal } from 'solid-js'

export function EditorViewOptions() {
  const [showLineNumbers, setShowLineNumbers] = createSignal(true)
  const [showMinimap, setShowMinimap] = createSignal(true)
  const [previewTabs, setPreviewTabs] = createSignal(false)
  const [autoSave, setAutoSave] = createSignal(true)
  const [theme, setTheme] = createSignal<'light' | 'dark' | 'system'>('dark')

  const editorItems = createMemo<NonNullable<DropdownMenuT.Base['items']>>(() => [
    [
      { type: 'label', label: 'Editor' },
      {
        label: 'Command Palette',
        description: 'Jump to commands, files, and symbols',
        icon: 'i-lucide-search',
        kbds: ['⌘', 'K'],
      },
      {
        label: 'Go to File…',
        icon: 'i-lucide-file-search',
        kbds: ['⌘', 'P'],
      },
      {
        label: 'Open Recent',
        icon: 'i-lucide-history',
        children: [
          [
            { type: 'label', label: 'Recent Files' },
            {
              label: 'src/overlays/dropdown-menu/dropdown-menu.tsx',
              icon: 'i-lucide-file-code-2',
            },
            {
              label: 'docs/components/context-menu-demos.tsx',
              icon: 'i-lucide-file-code-2',
            },
            {
              label: 'Pinned Workspaces',
              icon: 'i-lucide-star',
              children: [
                [
                  {
                    label: 'Flint UI',
                    description: 'packages + docs',
                    icon: 'i-lucide-folder-kanban',
                  },
                  {
                    label: 'Docs Site',
                    description: 'marketing + guides',
                    icon: 'i-lucide-book-open',
                  },
                ],
              ],
            },
          ],
        ],
      },
    ],
    [
      { type: 'label', label: 'View' },
      {
        type: 'checkbox',
        label: 'Line Numbers',
        icon: 'i-lucide-list',
        checked: showLineNumbers(),
        onCheckedChange: (checked: boolean) => setShowLineNumbers(checked),
      },
      {
        type: 'checkbox',
        label: 'Minimap',
        icon: 'i-lucide-map',
        checked: showMinimap(),
        onCheckedChange: (checked: boolean) => setShowMinimap(checked),
      },
      {
        type: 'checkbox',
        label: 'Preview Tabs',
        icon: 'i-lucide-panel-top',
        checked: previewTabs(),
        onCheckedChange: (checked: boolean) => setPreviewTabs(checked),
      },
      {
        type: 'checkbox',
        label: 'Auto Save',
        icon: 'i-lucide-save',
        checked: autoSave(),
        onCheckedChange: (checked: boolean) => setAutoSave(checked),
      },
      { type: 'separator' },
      {
        label: 'Theme',
        icon: 'i-lucide-palette',
        children: [
          [
            { type: 'label', label: 'Appearance' },
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
        ],
      },
    ],
    [
      { type: 'label', label: 'Panels' },
      {
        label: 'Toggle Terminal',
        icon: 'i-lucide-square-terminal',
        kbds: ['⌃', '`'],
      },
      {
        label: 'Focus Problems',
        icon: 'i-lucide-triangle-alert',
        kbds: ['⇧', '⌘', 'M'],
      },
    ],
  ])

  return (
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-3 items-center">
        <DropdownMenu items={editorItems()}>
          <Button variant="outline">Editor menu</Button>
        </DropdownMenu>
      </div>
      <div class="text-sm text-muted-foreground flex flex-wrap gap-4">
        <span>
          Line numbers: <span class="font-medium">{String(showLineNumbers())}</span>
        </span>
        <span>
          Minimap: <span class="font-medium">{String(showMinimap())}</span>
        </span>
        <span>
          Preview tabs: <span class="font-medium">{String(previewTabs())}</span>
        </span>
        <span>
          Auto save: <span class="font-medium">{String(autoSave())}</span>
        </span>
        <span>
          Theme: <span class="font-medium uppercase">{theme()}</span>
        </span>
      </div>
    </div>
  )
}
