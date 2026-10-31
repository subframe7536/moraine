import { Icon, List } from '@src'
import { createSortable } from '@src/dnd'
import { createSignal } from 'solid-js'

const TASKS = [
  { id: 'design', label: 'Review the release notes draft' },
  { id: 'qa', label: 'Run the regression suite' },
  { id: 'docs', label: 'Publish the migration guide' },
  { id: 'notify', label: 'Announce the release' },
  { id: 'retro', label: 'Schedule the retrospective' },
]

export function Sortable() {
  const [tasks, setTasks] = createSignal(TASKS)
  const sortable = createSortable()

  return (
    <List
      items={tasks()}
      sortable={sortable}
      onReorder={(event) => setTasks(event.items)}
      aria-label="Release checklist"
      class="border border-border rounded-md max-w-md w-full overflow-hidden"
      itemRender={(row) => (
        <li
          {...row.props}
          class="text-sm px-2 py-2 border-b border-border bg-background flex gap-2 items-center last:border-b-0 data-[drop-position=after]:shadow-[inset_0_-2px_0_var(--primary)] data-[drop-position=before]:shadow-[inset_0_2px_0_var(--primary)] data-dragging:shadow-lg"
        >
          <button
            ref={row.handleRef}
            type="button"
            aria-label={`Reorder ${row.item.label}`}
            class="text-muted-foreground rounded-sm flex size-6 cursor-grab items-center justify-center hover:bg-accent"
          >
            <Icon name="i-lucide:grip-vertical" />
          </button>
          {row.item.label}
        </li>
      )}
    />
  )
}
