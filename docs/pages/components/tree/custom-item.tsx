import { Badge, createTree } from '@src'
import { Show } from 'solid-js'

interface Workspace {
  id: string
  name: string
  count?: number
  children?: Workspace[]
}

const WORKSPACES: Workspace[] = [
  {
    id: 'acme',
    name: 'Acme',
    children: [
      { id: 'web', name: 'Web app', count: 12 },
      { id: 'mobile', name: 'Mobile app', count: 4 },
    ],
  },
  { id: 'personal', name: 'Personal', count: 2 },
]

export function CustomItem() {
  const tree = createTree<Workspace>({
    items: () => WORKSPACES,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    defaultExpandedKeys: ['acme'],
  })

  return (
    <div class="max-w-sm w-full">
      <tree.Tree
        aria-label="Workspaces"
        itemRender={(item) => (
          <tree.Item item={item}>
            <tree.ItemTrigger />
            <tree.ItemIcon
              icon={item.hasChildren ? 'i-lucide:building-2' : 'i-lucide:layout-dashboard'}
            />
            <tree.ItemLabel />
            <Show when={item.raw.count}>
              {(count) => (
                <Badge variant="soft" size="sm">
                  {count()}
                </Badge>
              )}
            </Show>
          </tree.Item>
        )}
      />
    </div>
  )
}
