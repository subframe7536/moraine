import { ContextMenu } from '@src'
import type { ContextMenuT } from '@src'
import { createMemo, createSignal } from 'solid-js'

export function EditorSelection() {
  const [showMinimap, setShowMinimap] = createSignal(true)
  const [showStickyScroll, setShowStickyScroll] = createSignal(true)
  const [showInlineHints, setShowInlineHints] = createSignal(false)
  const [editorTheme, setEditorTheme] = createSignal<'light' | 'dark' | 'system'>('dark')

  const editorItems = createMemo<ContextMenuT.Items[]>(() => [
    {
      type: 'group',
      label: 'Editor Selection',
      children: [
        {
          label: 'Quick Fix…',
          icon: 'i-lucide-wand-sparkles',
          kbds: ['⌘', '.'],
        },
        {
          label: 'Refactor',
          icon: 'i-lucide-git-branch-plus',
          children: [
            {
              type: 'group',
              children: [
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
            },
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
    },
    {
      type: 'group',
      label: 'Theme',
      children: [
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
    },
  ])

  return (
    <div class="flex flex-col">
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
    </div>
  )
}
