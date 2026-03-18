import { createMemo, createSignal } from 'solid-js'

import { ContextMenu } from '../../../src'
import type { ContextMenuT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const badgeClass =
  'rounded-md b-1 b-border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-medium text-[11px] text-zinc-700'

const surfaceClass =
  'flex h-24 w-full items-center justify-center rounded-lg b-1 b-border border-zinc-200 bg-white text-sm text-zinc-700'

const panelClass =
  'flex min-h-28 w-full flex-col justify-between rounded-lg b-1 b-border border-zinc-200 bg-white p-4 text-sm text-zinc-700'

export default () => {
  const [lastAction, setLastAction] = createSignal('None')
  const [showMinimap, setShowMinimap] = createSignal(true)
  const [showStickyScroll, setShowStickyScroll] = createSignal(true)
  const [showInlineHints, setShowInlineHints] = createSignal(false)
  const [editorTheme, setEditorTheme] = createSignal<'light' | 'dark' | 'system'>('dark')

  const fileItems: ContextMenuT.Items = [
    [
      { type: 'label', label: 'File Actions' },
      {
        label: 'Open File',
        icon: 'i-lucide-file-code-2',
        kbds: ['↵'],
        onSelect: () => setLastAction('Open file'),
      },
      {
        label: 'Open in Split View',
        icon: 'i-lucide-split-square-horizontal',
        kbds: ['⌘', '\\'],
        onSelect: () => setLastAction('Open in split view'),
      },
      {
        label: 'Reveal in Explorer',
        icon: 'i-lucide-folder-search-2',
        onSelect: () => setLastAction('Reveal in explorer'),
      },
      { type: 'separator' },
      {
        label: 'Move To…',
        icon: 'i-lucide-folder-input',
        children: [
          [
            {
              type: 'label',
              label: 'Recent Folders',
            },
            {
              label: 'src/overlays',
              icon: 'i-lucide-folder-open',
              onSelect: () => setLastAction('Move to src/overlays'),
            },
            {
              label: 'src/navigation',
              icon: 'i-lucide-folder-open',
              onSelect: () => setLastAction('Move to src/navigation'),
            },
            {
              label: 'More Destinations',
              icon: 'i-lucide-more-horizontal',
              children: [
                [
                  {
                    label: 'docs/components',
                    icon: 'i-lucide-folder-open',
                    onSelect: () => setLastAction('Move to docs/components'),
                  },
                  {
                    label: 'docs/content',
                    icon: 'i-lucide-folder-open',
                    onSelect: () => setLastAction('Move to docs/content'),
                  },
                ],
              ],
            },
          ],
        ],
      },
      {
        label: 'Copy Path',
        icon: 'i-lucide-copy',
        kbds: ['⌘', '⌥', 'C'],
        onSelect: () => setLastAction('Copy path'),
      },
    ],
    [
      {
        label: (
          <div class="flex gap-2 items-center">
            <span>Rename</span>
            <span class={badgeClass}>F2</span>
          </div>
        ),
        icon: 'i-lucide-pencil',
        onSelect: () => setLastAction('Rename file'),
      },
      {
        label: 'Delete',
        icon: 'i-lucide-trash-2',
        color: 'destructive',
        onSelect: () => setLastAction('Delete file'),
      },
    ],
  ]

  const editorItems = createMemo<ContextMenuT.Items>(() => [
    [
      { type: 'label', label: 'Editor Selection' },
      {
        label: 'Quick Fix…',
        icon: 'i-lucide-wand-sparkles',
        kbds: ['⌘', '.'],
        onSelect: () => setLastAction('Quick fix'),
      },
      {
        label: 'Refactor',
        icon: 'i-lucide-git-branch-plus',
        children: [
          [
            {
              label: 'Extract Variable',
              icon: 'i-lucide-variable',
              onSelect: () => setLastAction('Extract variable'),
            },
            {
              label: 'Extract Function',
              icon: 'i-lucide-braces',
              onSelect: () => setLastAction('Extract function'),
            },
            {
              label: 'Move to File…',
              icon: 'i-lucide-file-output',
              onSelect: () => setLastAction('Move selection to file'),
            },
          ],
        ],
      },
      { type: 'separator' },
      {
        type: 'checkbox',
        label: 'Show Minimap',
        icon: 'i-lucide-map',
        checked: showMinimap(),
        onCheckedChange: (checked: boolean) => setShowMinimap(checked),
      },
      {
        type: 'checkbox',
        label: 'Sticky Scroll',
        icon: 'i-lucide-panel-top',
        checked: showStickyScroll(),
        onCheckedChange: (checked: boolean) => setShowStickyScroll(checked),
      },
      {
        type: 'checkbox',
        label: 'Inline Hints',
        icon: 'i-lucide-message-square-quote',
        checked: showInlineHints(),
        onCheckedChange: (checked: boolean) => setShowInlineHints(checked),
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

  const projectItems: ContextMenuT.Items = [
    [
      {
        type: 'label',
        label: (
          <div class="flex gap-2 items-center">
            <span>Issue: Improve menu transitions</span>
            <span class={badgeClass}>P1</span>
          </div>
        ),
      },
      {
        label: 'Open Issue',
        icon: 'i-lucide-external-link',
        onSelect: () => setLastAction('Open issue'),
      },
      {
        label: 'Assign',
        icon: 'i-lucide-user-round-plus',
        children: [
          [
            {
              label: 'Alex Morgan',
              description: 'Design systems',
              icon: 'i-lucide-user',
              onSelect: () => setLastAction('Assign Alex Morgan'),
            },
            {
              label: 'Jamie Chen',
              description: 'Overlay primitives',
              icon: 'i-lucide-user',
              onSelect: () => setLastAction('Assign Jamie Chen'),
            },
          ],
        ],
      },
      {
        label: 'Move to Sprint',
        icon: 'i-lucide-calendar-range',
        children: [
          [
            {
              label: 'Sprint 18',
              onSelect: () => setLastAction('Move to Sprint 18'),
            },
            {
              label: 'Sprint 19',
              onSelect: () => setLastAction('Move to Sprint 19'),
            },
            {
              label: 'Backlog',
              onSelect: () => setLastAction('Move to backlog'),
            },
          ],
        ],
      },
    ],
    [
      {
        label: 'Edit Details',
        icon: 'i-lucide-pencil',
        onSelect: () => setLastAction('Edit details'),
      },
      {
        label: 'Share Update',
        icon: 'i-lucide-share-2',
        onSelect: () => setLastAction('Share update'),
      },
      { type: 'separator' },
      {
        label: 'Archive',
        icon: 'i-lucide-archive',
        onSelect: () => setLastAction('Archive issue'),
      },
      {
        label: 'Delete Issue',
        icon: 'i-lucide-trash-2',
        color: 'destructive',
        onSelect: () => setLastAction('Delete issue'),
      },
    ],
  ]

  return (
    <DemoPage componentKey="context-menu">
      <DemoSection
        title="File Explorer"
        description="A file-row context menu with move flows, shortcuts, mixed labels, and destructive actions."
      >
        <ContextMenu items={fileItems}>
          <div class={panelClass}>
            <div class="flex gap-3 items-center justify-between">
              <div>
                <div class="text-zinc-900 font-medium">dropdown-menu.tsx</div>
                <div class="text-xs text-zinc-500">src/overlays/dropdown-menu</div>
              </div>
              <span class={badgeClass}>Modified</span>
            </div>
            <div class="text-xs text-zinc-500">Right click this file row</div>
          </div>
        </ContextMenu>
        <p class="text-sm text-zinc-600 mt-3">
          Last action: <span class="font-medium">{lastAction()}</span>
        </p>
      </DemoSection>

      <DemoSection
        title="Editor Selection"
        description="A code-editor-style context menu with refactors, toggles, and theme switching for keyboard and pointer testing."
      >
        <ContextMenu items={editorItems()}>
          <div class={panelClass}>
            <div class="text-xs text-zinc-800 font-mono">
              const motion = resolveOverlayMenuSide(placement)
            </div>
            <div class="text-xs text-zinc-500">Right click the selected line</div>
          </div>
        </ContextMenu>
        <div class="text-sm text-zinc-600 mt-3 flex flex-wrap gap-4">
          <span>
            Minimap: <span class="font-medium">{String(showMinimap())}</span>
          </span>
          <span>
            Sticky scroll: <span class="font-medium">{String(showStickyScroll())}</span>
          </span>
          <span>
            Inline hints: <span class="font-medium">{String(showInlineHints())}</span>
          </span>
          <span>
            Theme: <span class="font-medium uppercase">{editorTheme()}</span>
          </span>
        </div>
      </DemoSection>

      <DemoSection
        title="Placements"
        description="Same file menu rendered with top/right/bottom/left placements for quick transition-direction sanity checks."
      >
        <div class="gap-3 grid sm:grid-cols-2">
          <ContextMenu placement="top" items={fileItems}>
            <div class={surfaceClass}>Right click (top)</div>
          </ContextMenu>
          <ContextMenu placement="right" items={fileItems}>
            <div class={surfaceClass}>Right click (right)</div>
          </ContextMenu>
          <ContextMenu placement="bottom" items={fileItems}>
            <div class={surfaceClass}>Right click (bottom)</div>
          </ContextMenu>
          <ContextMenu placement="left" items={fileItems}>
            <div class={surfaceClass}>Right click (left)</div>
          </ContextMenu>
        </div>
      </DemoSection>

      <DemoSection
        title="Project / Issue Actions"
        description="A denser project card menu with assignee and sprint submenus plus archive/delete actions."
      >
        <ContextMenu items={projectItems}>
          <div class={panelClass}>
            <div class="flex gap-3 items-center justify-between">
              <div>
                <div class="text-zinc-900 font-medium">
                  Improve dropdown/context menu motion polish
                </div>
                <div class="text-xs text-zinc-500">Overlay milestone · due this sprint</div>
              </div>
              <span class={badgeClass}>In Review</span>
            </div>
            <div class="text-xs text-zinc-500">Right click this card</div>
          </div>
        </ContextMenu>
      </DemoSection>
    </DemoPage>
  )
}
