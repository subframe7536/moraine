import { List } from '@src'

const JOBS = [
  {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    team: 'Product Engineering',
    location: 'Remote',
  },
  {
    id: 'design-engineer',
    title: 'Design Engineer',
    team: 'Design Systems',
    location: 'Shanghai',
  },
  {
    id: 'developer-advocate',
    title: 'Developer Advocate',
    team: 'Developer Experience',
    location: 'Singapore',
  },
]

export function Basic() {
  return (
    <List
      items={JOBS}
      aria-label="Open positions"
      class="border border-border rounded-md divide-border divide-y"
      itemRender={(context) => (
        <li class="p-3 flex gap-3 items-center justify-between">
          <span class="flex flex-col min-w-0">
            <span class="font-medium">{context.item.title}</span>
            <span class="text-sm text-muted-foreground">{context.item.team}</span>
          </span>
          <span class="text-xs text-muted-foreground shrink-0">{context.item.location}</span>
        </li>
      )}
    />
  )
}
