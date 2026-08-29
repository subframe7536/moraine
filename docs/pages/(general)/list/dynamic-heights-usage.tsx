import { Badge, List } from '@src'

interface CommentItem {
  id: string
  author: string
  role: string
  message: string
}

const COMMENTS: CommentItem[] = [
  {
    id: '1',
    author: 'Alex Rivera',
    role: 'Maintainer',
    message: 'Short feedback note on token naming.',
  },
  {
    id: '2',
    author: 'Sam Chen',
    role: 'Contributor',
    message:
      'Detailed summary explaining performance optimizations, accessibility attributes, SSR hydration tests, and responsive layout constraints.',
  },
  { id: '3', author: 'Taylor Swift', role: 'Member', message: 'Ready to approve and merge!' },
]

export function DynamicHeightsUsage() {
  return (
    <div class="p-2 b-(1 border) rounded-xl max-h-64 max-w-md w-full overflow-y-auto">
      <List
        as="div"
        items={COMMENTS}
        itemRender={(context) => (
          <div class="p-3 b-b-(1 border) space-y-1.5 last:b-b-0">
            <div class="flex items-center justify-between">
              <span class="text-xs text-foreground font-semibold">{context.item.author}</span>
              <Badge variant="outline" size="sm">
                {context.item.role}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">{context.item.message}</p>
          </div>
        )}
      />
    </div>
  )
}
