import { ContextMenu } from '@src'
import { createSignal } from 'solid-js'

export function FileExplorer() {
  const badgeClass =
    'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

  const [lastAction, setLastAction] = createSignal('None')

  return (
    <div class="flex flex-col gap-4">
      <ContextMenu
        items={[
          {
            type: 'group',
            label: (
              <div class="flex gap-2 items-center">
                <span>Issue: Improve menu transitions</span>
                <span class={badgeClass}>P1</span>
              </div>
            ),
            children: [
              {
                label: 'Open Issue',
                icon: 'i-lucide-external-link',
                onSelect: () => setLastAction('Open issue'),
              },
              {
                label: 'Assign',
                icon: 'i-lucide-user-round-plus',
                children: [
                  {
                    type: 'group',
                    children: [
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
                  },
                ],
              },
              {
                label: 'Move to Sprint',
                icon: 'i-lucide-calendar-range',
                children: [
                  {
                    type: 'group',
                    children: [
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
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            children: [
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
          },
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
      <p class="text-sm text-muted-foreground px-4">
        Last action: <span class="font-medium">{lastAction()}</span>
      </p>
    </div>
  )
}
