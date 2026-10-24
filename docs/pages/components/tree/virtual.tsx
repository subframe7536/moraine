import { createTree } from '@src'
import type { TreeT } from '@src'
import { createListVirtualizer } from '@src/virtualizer'

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
  const virtualizer = createListVirtualizer<TreeT.ItemInstance<Row>>({
    estimateSize: () => 32,
    getItemKey: (entry) => entry.key,
  })

  return (
    <div class="max-w-sm w-full space-y-2">
      <tree.Tree
        aria-label="Ten thousand rows"
        virtualRender={virtualizer.virtualRender}
        scrollToItem={(_entry, index) => virtualizer.scrollToIndex(index)}
        class="p-1 border border-border rounded-lg h-[280px] overflow-auto"
      />
      <p class="text-xs text-muted-foreground">
        Expand a group to flatten its 50 items into the same virtualized list.
      </p>
    </div>
  )
}
