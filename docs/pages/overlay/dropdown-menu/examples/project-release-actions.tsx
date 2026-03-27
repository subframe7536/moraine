import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'
import { createSignal } from 'solid-js'

export function ProjectReleaseActions() {
  const [lastAction, setLastAction] = createSignal('None')

  const badgeClass =
    'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

  const projectItems: DropdownMenuT.Items[] = [
    {
      type: 'group',
      label: (
        <div class="flex gap-2 items-center">
          <span>Project: moraine</span>
          <span class={badgeClass}>main</span>
        </div>
      ),
      children: [
        {
          label: 'New File',
          icon: 'i-lucide-file-plus',
          kbds: ['⌘', 'N'],
          onSelect: () => setLastAction('New file'),
        },
        {
          label: 'New Folder',
          icon: 'i-lucide-folder-plus',
          kbds: ['⇧', '⌘', 'N'],
          onSelect: () => setLastAction('New folder'),
        },
        {
          label: 'Rename Project',
          icon: 'i-lucide-pencil',
          kbds: ['F2'],
          onSelect: () => setLastAction('Rename project'),
        },
        { type: 'separator' },
        {
          label: 'Move To…',
          icon: 'i-lucide-folder-input',
          children: [
            {
              type: 'group',
              label: 'Favorite Folders',
              children: [
                {
                  label: 'src/components',
                  icon: 'i-lucide-folder-open',
                  onSelect: () => setLastAction('Move to src/components'),
                },
                {
                  label: 'src/overlays',
                  icon: 'i-lucide-folder-open',
                  onSelect: () => setLastAction('Move to src/overlays'),
                },
                {
                  label: 'More Destinations',
                  icon: 'i-lucide-more-horizontal',
                  children: [
                    {
                      type: 'group',
                      children: [
                        {
                          label: 'docs/content',
                          icon: 'i-lucide-folder-open',
                          onSelect: () => setLastAction('Move to docs/content'),
                        },
                        {
                          label: 'archive/2025',
                          icon: 'i-lucide-folder-open',
                          onSelect: () => setLastAction('Move to archive/2025'),
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Copy Preview Link',
          icon: 'i-lucide-link',
          kbds: ['⌘', '⇧', 'C'],
          onSelect: () => setLastAction('Copy preview link'),
        },
      ],
    },
    {
      type: 'group',
      label: 'Release',
      children: [
        {
          label: 'Open Pull Request',
          icon: 'i-lucide-git-pull-request-arrow',
          onSelect: () => setLastAction('Open pull request'),
        },
        {
          label: 'Deploy Preview',
          description: 'Build preview for design review',
          icon: 'i-lucide-rocket',
          onSelect: () => setLastAction('Deploy preview'),
        },
        {
          label: (
            <div class="flex gap-2 items-center">
              <span>Ship to Production</span>
              <span class="text-[11px] text-amber-700 font-medium px-1.5 py-0.5 rounded-md bg-amber-100">
                Protected
              </span>
            </div>
          ),
          description: 'Requires review approval',
          icon: <span class="rounded-full bg-emerald-500 size-2 inline-block" />,
          onSelect: () => setLastAction('Ship to production'),
        },
      ],
    },
    {
      type: 'group',
      children: [
        {
          label: 'Archive Project',
          icon: 'i-lucide-archive',
          onSelect: () => setLastAction('Archive project'),
        },
        {
          label: 'Delete Project',
          icon: 'i-lucide-trash-2',
          color: 'destructive',
          onSelect: () => setLastAction('Delete Project'),
        },
      ],
    },
  ]

  return (
    <>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DropdownMenu items={projectItems}>
          <Button>Project actions</Button>
        </DropdownMenu>
        <p class="text-sm text-muted-foreground">
          Tip: use arrow keys to walk the nested “Move To…” and release sections.
        </p>
      </div>
      <div class="text-sm text-muted-foreground">
        Last action: <span class="font-medium">{lastAction()}</span>
      </div>
    </>
  )
}
