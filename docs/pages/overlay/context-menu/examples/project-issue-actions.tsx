import { ContextMenu } from '@src'
import type { ContextMenuT } from '@src'

const badgeClass =
  'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

export function ProjectIssueActions() {
  const panelClass =
    'flex min-h-28 w-full flex-col justify-between rounded-lg b-1 b-border border-border bg-background p-4 text-sm text-foreground'

  const projectItems: NonNullable<ContextMenuT.Base['items']> = [
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
