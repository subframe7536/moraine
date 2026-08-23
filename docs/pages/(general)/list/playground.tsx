import { Badge, List } from '@src'

const PROJECT_ITEMS = [
  { id: '1', name: 'Moraine UI', status: 'Active', category: 'Design System' },
  { id: '2', name: 'SolidDocs', status: 'Review', category: 'Documentation' },
  { id: '3', name: 'Formisch', status: 'Stable', category: 'Form Validation' },
]

export interface ListPlaygroundProps {
  label?: string
}

export function ListPlayground(props: ListPlaygroundProps) {
  return (
    <div class="max-w-full w-80">
      <p class="text-xs text-muted-foreground/80 tracking-wider font-medium mb-2 uppercase">
        {props.label ?? 'Recent projects'}
      </p>
      <List
        items={PROJECT_ITEMS}
        itemRender={(ctx) => (
          <li class="p-3 border-b border-border/50 rounded-lg flex transition-colors items-center justify-between last:border-0 hover:bg-muted/30">
            <div>
              <p class="text-xs text-foreground font-medium">{ctx.item.name}</p>
              <p class="text-[0.7rem] text-muted-foreground">{ctx.item.category}</p>
            </div>
            <Badge variant="outline" size="sm">
              {ctx.item.status}
            </Badge>
          </li>
        )}
        class="p-1 border border-border/60 rounded-xl bg-card/30"
      />
    </div>
  )
}
