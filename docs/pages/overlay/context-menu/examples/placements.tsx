import { ContextMenu } from '@src'
import type { ContextMenuT } from '@src'

export function Placements() {
  const surfaceClass =
    'flex h-24 w-full items-center justify-center rounded-lg b-1 b-border border-border bg-background text-sm text-foreground'

  const badgeClass =
    'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

  const fileItems: NonNullable<ContextMenuT.Base['items']> = [
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
