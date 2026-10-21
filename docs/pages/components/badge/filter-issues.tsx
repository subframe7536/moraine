import { Badge } from '@src'
import { createMemo, createSignal, For } from 'solid-js'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'review', label: 'Needs review' },
] as const

const ISSUES = [
  { title: 'Hydration mismatch on Select', state: 'open' },
  { title: 'Document Field hidden labels', state: 'review' },
  { title: 'Fix Slider marker alignment', state: 'open' },
]

export function FilterIssues() {
  const [filter, setFilter] = createSignal<(typeof FILTERS)[number]['value']>('all')
  const visible = createMemo(() =>
    ISSUES.filter((issue) => filter() === 'all' || issue.state === filter()),
  )

  return (
    <div class="max-w-md w-full space-y-3">
      <div class="flex flex-wrap gap-2">
        <For each={FILTERS}>
          {(item) => (
            <Badge
              as="button"
              type="button"
              variant={filter() === item.value ? 'solid' : 'outline'}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Badge>
          )}
        </For>
      </div>
      <ul class="divide-border divide-y">
        <For each={visible()}>{(issue) => <li class="text-sm py-2">{issue.title}</li>}</For>
      </ul>
    </div>
  )
}
