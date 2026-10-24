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
        icons={{
          trigger: 'i-lucide:chevron-right',
          folder: 'i-lucide:building-2',
          folderOpen: 'i-lucide:building-2',
          file: 'i-lucide:layout-dashboard',
        }}
        itemRender={(context) => (
          <tree.Item item={context.item}>
            <tree.ItemTrigger />
            <tree.ItemIcon />
            <tree.ItemLabel />
            <Show when={context.item.raw.count}>
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
