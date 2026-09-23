import { Badge } from '@src'
import { For } from 'solid-js'

const TASKS = [
  { title: 'Review access request', status: 'Needs review', variant: 'outline' },
  { title: 'Publish release notes', status: 'In progress', variant: 'subtle' },
  { title: 'Archive old project', status: 'Complete', variant: 'solid' },
] as const

export function BadgeUsage() {
  return (
    <ul class="max-w-md w-full divide-border divide-y">
      <For each={TASKS}>
        {(task) => (
          <li class="py-2 flex gap-3 items-center justify-between">
            <span class="text-sm">{task.title}</span>
            <Badge variant={task.variant}>{task.status}</Badge>
          </li>
        )}
      </For>
    </ul>
  )
}
