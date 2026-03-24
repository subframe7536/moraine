import { createMemo, createSignal } from 'solid-js'

import { ContextMenu } from '../../../src'
import type { ContextMenuT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const badgeClass =
  'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

function FileExplorer() {
  const badgeClass =
    'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

  const [lastAction, setLastAction] = createSignal('None')

  return (
    <>
      <ContextMenu
        items={[
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
        ]}
      >
        <div class="text-sm text-foreground p-4 b-1 b-border border-border rounded-lg bg-background flex flex-col min-h-28 w-full justify-between">
          <div class="flex gap-3 items-center justify-between">
            <div>
              <div class="text-foreground font-medium">dropdown-menu.tsx</div>
              <div class="text-xs text-muted-foreground">src/overlays/dropdown-menu</div>
            </div>
            <span class={badgeClass}>Modified</span>
          </div>
          <div class="text-xs text-muted-foreground">Right click this file row</div>
        </div>
      </ContextMenu>
      <p class="text-sm text-muted-foreground mt-3">
        Last action: <span class="font-medium">{lastAction()}</span>
      </p>
    </>
  )
}

function EditorSelection() {
  const [showMinimap, setShowMinimap] = createSignal(true)
  const [showStickyScroll, setShowStickyScroll] = createSignal(true)
  const [showInlineHints, setShowInlineHints] = createSignal(false)
  const [editorTheme, setEditorTheme] = createSignal<'light' | 'dark' | 'system'>('dark')

  const editorItems = createMemo<ContextMenuT.Items>(() => [
    [
      { type: 'label', label: 'Editor Selection' },
      {
        label: 'Quick Fix…',
        icon: 'i-lucide-wand-sparkles',
        kbds: ['⌘', '.'],
      },
      {
        label: 'Refactor',
        icon: 'i-lucide-git-branch-plus',
        children: [
          [
            {
              label: 'Extract Variable',
              icon: 'i-lucide-variable',
            },
            {
              label: 'Extract Function',
              icon: 'i-lucide-braces',
            },
            {
              label: 'Move to File…',
              icon: 'i-lucide-file-output',
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

  return (
    <>
      <ContextMenu items={editorItems()}>
        <div class="text-sm text-foreground p-4 b-1 b-border border-border rounded-lg bg-background flex flex-col min-h-28 w-full justify-between">
          <div class="text-xs text-foreground font-mono">
            const motion = resolveOverlayMenuSide(placement)
          </div>
          <div class="text-xs text-muted-foreground">Right click the selected line</div>
        </div>
      </ContextMenu>
      <div class="text-sm text-muted-foreground mt-3 flex flex-wrap gap-4">
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
    </>
  )
}

function Placements() {
  const surfaceClass =
    'flex h-24 w-full items-center justify-center rounded-lg b-1 b-border border-border bg-background text-sm text-foreground'

  const badgeClass =
    'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

  const fileItems: ContextMenuT.Items = [
    [
      { type: 'label', label: 'File Actions' },
      {
        label: 'Open File',
        icon: 'i-lucide-file-code-2',
        kbds: ['↵'],
      },
      {
        label: 'Open in Split View',
        icon: 'i-lucide-split-square-horizontal',
        kbds: ['⌘', '\\'],
      },
      {
        label: 'Reveal in Explorer',
        icon: 'i-lucide-folder-search-2',
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
            },
            {
              label: 'src/navigation',
              icon: 'i-lucide-folder-open',
            },
            {
              label: 'More Destinations',
              icon: 'i-lucide-more-horizontal',
              children: [
                [
                  {
                    label: 'docs/components',
                    icon: 'i-lucide-folder-open',
                  },
                  {
                    label: 'docs/content',
                    icon: 'i-lucide-folder-open',
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
      },
      {
        label: 'Delete',
        icon: 'i-lucide-trash-2',
        color: 'destructive',
      },
    ],
  ]

  return (
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
  )
}

function ProjectIssueActions() {
  const panelClass =
    'flex min-h-28 w-full flex-col justify-between rounded-lg b-1 b-border border-border bg-background p-4 text-sm text-foreground'

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
            },
            {
              label: 'Jamie Chen',
              description: 'Overlay primitives',
              icon: 'i-lucide-user',
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
            },
            {
              label: 'Sprint 19',
            },
            {
              label: 'Backlog',
            },
          ],
        ],
      },
    ],
    [
      {
        label: 'Edit Details',
        icon: 'i-lucide-pencil',
      },
      {
        label: 'Share Update',
        icon: 'i-lucide-share-2',
      },
      { type: 'separator' },
      {
        label: 'Archive',
        icon: 'i-lucide-archive',
      },
      {
        label: 'Delete Issue',
        icon: 'i-lucide-trash-2',
        color: 'destructive',
      },
    ],
  ]

  return (
    <ContextMenu items={projectItems}>
      <div class={panelClass}>
        <div class="flex gap-3 items-center justify-between">
          <div>
            <div class="text-foreground font-medium">
              Improve dropdown/context menu motion polish
            </div>
            <div class="text-xs text-muted-foreground">Overlay milestone · due this sprint</div>
          </div>
          <span class={badgeClass}>In Review</span>
        </div>
        <div class="text-xs text-muted-foreground">Right click this card</div>
      </div>
    </ContextMenu>
  )
}

export default () => {
  return (
    <DemoPage componentKey="context-menu">
      <DemoSection
        title="File Explorer"
        description="A file-row context menu with move flows, shortcuts, mixed labels, and destructive actions."
        demo={FileExplorer}
      />

      <DemoSection
        title="Editor Selection"
        description="A code-editor-style context menu with refactors, toggles, and theme switching for keyboard and pointer testing."
        demo={EditorSelection}
      />

      <DemoSection
        title="Placements"
        description="Same file menu rendered with top/right/bottom/left placements for quick transition-direction sanity checks."
        demo={Placements}
      />

      <DemoSection
        title="Project / Issue Actions"
        description="A denser project card menu with assignee and sprint submenus plus archive/delete actions."
        demo={ProjectIssueActions}
      />
    </DemoPage>
  )
}
