import { List } from '@src'

const COMMENTS = [
  { id: '1', author: 'Alex', message: 'Short feedback note.' },
  {
    id: '2',
    author: 'Sam',
    message:
      'Long detailed comment with multiple lines of explanations about system architecture, components, accessibility features, and responsiveness.',
  },
  { id: '3', author: 'Taylor', message: 'Looks great!' },
]

export function DynamicHeightsUsage() {
  return (
    <div class="p-2 b-(1 border) rounded-xl max-h-60 max-w-md w-full overflow-y-auto">
      <List
        items={COMMENTS}
        itemRender={(context) => (
          <div class="p-3 b-b-(1 border) space-y-1 last:b-b-0">
            <span class="text-xs text-foreground font-medium">{context.item.author}</span>
            <p class="text-xs text-muted-foreground leading-relaxed">{context.item.message}</p>
          </div>
        )}
      />
    </div>
  )
}
