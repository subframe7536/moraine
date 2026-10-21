import { Breadcrumb } from '@src'

const TRAIL = [
  { label: 'Documentation', href: '/docs' },
  { label: 'Components', href: '/components' },
  { label: 'Breadcrumb' },
]

export function CustomItemRender() {
  return (
    <div class="max-w-md w-full">
      <Breadcrumb
        items={TRAIL}
        itemRender={(props) => (
          <a
            href={props.item.href}
            class="text-xs px-2 py-1 rounded-md inline-flex gap-1.5 transition-colors items-center"
            classList={{
              'bg-primary/10 text-primary font-medium': props.current,
              'text-muted-foreground hover:text-foreground': !props.current,
            }}
          >
            <span>{props.item.label}</span>
          </a>
        )}
      />
    </div>
  )
}
