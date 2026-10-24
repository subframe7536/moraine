import { createTree } from '@src'

interface Row {
  id: string
  name: string
  children?: Row[]
}

const GROUPS: Row[] = Array.from({ length: 200 }, (_, group) => ({
  id: `group-${group}`,
  name: `Group ${group + 1}`,
  children: Array.from({ length: 50 }, (_, index) => ({
    id: `group-${group}-item-${index}`,
    name: `Item ${group + 1}.${index + 1}`,
  })),
}))

export function Virtual() {
  const tree = createTree<Row>({
    items: () => GROUPS,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    defaultExpandedKeys: ['group-0'],
  })

  return (
    <div class="max-w-sm w-full space-y-2">
      <tree.Tree
        aria-label="Ten thousand rows"
        virtual={{ estimateSize: 32, height: 280 }}
        class="p-1 border border-border rounded-lg"
      />
      <p class="text-xs text-muted-foreground">
        Expand a group to flatten its 50 items into the same virtualized list.
      </p>
    </div>
  )
}
