import { List } from '@src'

const TASKS = [
  { id: '1', title: 'Review pull request #42', priority: 'high' },
  { id: '2', title: 'Update design tokens in UnoCSS', priority: 'medium' },
  { id: '3', title: 'Release v1.2 patch notes', priority: 'low' },
]

export function ListUsage() {
  return (
    <div class="p-2 b-(1 border) rounded-xl max-w-md w-full">
      <List
        items={TASKS}
        itemRender={(context) => (
          <li class="text-sm p-2.5 b-b-(1 border) flex items-center justify-between last:b-b-0">
            <span>{context.item.title}</span>
            <span class="text-xs text-muted-foreground uppercase">{context.item.priority}</span>
          </li>
        )}
      />
    </div>
  )
}
