import { createMemo, createSignal } from 'solid-js'

import { ContextMenu } from '../../src'
import type { ContextMenuItems } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const surfaceClass =
  'flex h-24 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700'

export const ContextMenuDemos = () => {
  const [lastAction, setLastAction] = createSignal('None')
  const [showBookmarksBar, setShowBookmarksBar] = createSignal(true)
  const [showFullUrls, setShowFullUrls] = createSignal(false)
  const [showDevTools, setShowDevTools] = createSignal(true)
  const [editorTheme, setEditorTheme] = createSignal<'light' | 'dark' | 'system'>('light')

  const basicItems: ContextMenuItems = [
    [
      {
        label: 'Back',
        icon: 'i-lucide-arrow-left',
        kbds: ['⌘', '['],
        onSelect: () => setLastAction('Back'),
      },
      {
        label: 'Forward',
        icon: 'i-lucide-arrow-right',
        kbds: ['⌘', ']'],
        disabled: true,
      },
      {
        label: 'Reload',
        icon: 'i-lucide-refresh-cw',
        kbds: ['⌘', 'R'],
        onSelect: () => setLastAction('Reload'),
      },
    ],
  ]

  const submenuItems: ContextMenuItems = [
    [
      {
        label: 'Copy',
        icon: 'i-lucide-copy',
        kbds: ['⌘', 'C'],
        onSelect: () => setLastAction('Copy'),
      },
      {
        label: 'Cut',
        icon: 'i-lucide-scissors',
        kbds: ['⌘', 'X'],
        onSelect: () => setLastAction('Cut'),
      },
      { type: 'separator' },
      {
        label: 'More Tools',
        icon: 'i-lucide-wrench',
        children: [
          [
            {
              label: 'Save Page...',
              onSelect: () => setLastAction('Save Page'),
            },
            {
              label: 'Create Shortcut...',
              onSelect: () => setLastAction('Create Shortcut'),
            },
            {
              label: 'Name Window...',
              onSelect: () => setLastAction('Name Window'),
            },
            { type: 'separator' },
            {
              label: 'Developer Tools',
              onSelect: () => setLastAction('Developer Tools'),
            },
          ],
        ],
      },
    ],
  ]

  const checkboxItems = createMemo<ContextMenuItems>(() => [
    [
      {
        type: 'checkbox',
        label: 'Show Bookmarks Bar',
        checked: showBookmarksBar(),
        onCheckedChange: (checked) => setShowBookmarksBar(checked),
      },
      {
        type: 'checkbox',
        label: 'Show Full URLs',
        checked: showFullUrls(),
        onCheckedChange: (checked) => setShowFullUrls(checked),
      },
      {
        type: 'checkbox',
        label: 'Show Developer Tools',
        checked: showDevTools(),
        onCheckedChange: (checked) => setShowDevTools(checked),
      },
    ],
    [
      { type: 'label', label: 'Theme' },
      {
        label: 'Light',
        icon: editorTheme() === 'light' ? 'i-lucide-check' : 'i-lucide-sun',
        onSelect: () => setEditorTheme('light'),
      },
      {
        label: 'Dark',
        icon: editorTheme() === 'dark' ? 'i-lucide-check' : 'i-lucide-moon',
        onSelect: () => setEditorTheme('dark'),
      },
      {
        label: 'System',
        icon: editorTheme() === 'system' ? 'i-lucide-check' : 'i-lucide-monitor',
        onSelect: () => setEditorTheme('system'),
      },
    ],
  ])

  const destructiveItems: ContextMenuItems = [
    [
      {
        label: 'Edit',
        icon: 'i-lucide-pencil',
        onSelect: () => setLastAction('Edit'),
      },
      {
        label: 'Share',
        icon: 'i-lucide-share-2',
        onSelect: () => setLastAction('Share'),
      },
      { type: 'separator' },
      {
        label: 'Archive',
        icon: 'i-lucide-archive',
        onSelect: () => setLastAction('Archive'),
      },
      {
        label: 'Delete',
        icon: 'i-lucide-trash-2',
        color: 'destructive',
        onSelect: () => setLastAction('Delete'),
      },
    ],
  ]

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Context Menu"
      description="Updated from Zaidan patterns: shortcut actions, nested tools, checkbox toggles, placements, and destructive rows."
    >
      <DemoSection
        title="Basic / Shortcuts"
        description="Right click to open browser-like navigation actions with shortcuts."
      >
        <ContextMenu items={basicItems}>
          <div class={surfaceClass}>Right click this area</div>
        </ContextMenu>
        <p class="text-sm text-zinc-600 mt-3">
          Last action: <span class="font-medium">{lastAction()}</span>
        </p>
      </DemoSection>

      <DemoSection
        title="Submenu"
        description="Nested actions modeled after Zaidan context menu examples."
      >
        <ContextMenu items={submenuItems}>
          <div class={surfaceClass}>Right click for “More Tools” submenu</div>
        </ContextMenu>
      </DemoSection>

      <DemoSection
        title="Checkboxes / Theme"
        description="Controlled checkbox rows and pseudo-radio theme pick rows."
      >
        <ContextMenu items={checkboxItems()}>
          <div class={surfaceClass}>Right click for view preferences</div>
        </ContextMenu>
        <div class="text-sm text-zinc-600 mt-3 flex flex-wrap gap-4">
          <span>
            Bookmarks: <span class="font-medium">{String(showBookmarksBar())}</span>
          </span>
          <span>
            Full URLs: <span class="font-medium">{String(showFullUrls())}</span>
          </span>
          <span>
            DevTools: <span class="font-medium">{String(showDevTools())}</span>
          </span>
          <span>
            Theme: <span class="font-medium uppercase">{editorTheme()}</span>
          </span>
        </div>
      </DemoSection>

      <DemoSection
        title="Placements"
        description="Same menu content rendered with top/right/bottom/left placements."
      >
        <div class="gap-3 grid sm:grid-cols-2">
          <ContextMenu placement="top" items={basicItems}>
            <div class={surfaceClass}>Right click (top)</div>
          </ContextMenu>
          <ContextMenu placement="right" items={basicItems}>
            <div class={surfaceClass}>Right click (right)</div>
          </ContextMenu>
          <ContextMenu placement="bottom" items={basicItems}>
            <div class={surfaceClass}>Right click (bottom)</div>
          </ContextMenu>
          <ContextMenu placement="left" items={basicItems}>
            <div class={surfaceClass}>Right click (left)</div>
          </ContextMenu>
        </div>
      </DemoSection>

      <DemoSection title="Destructive" description="Action stack with destructive item styling.">
        <ContextMenu items={destructiveItems}>
          <div class={surfaceClass}>Right click for destructive actions</div>
        </ContextMenu>
      </DemoSection>
    </DemoPage>
  )
}
