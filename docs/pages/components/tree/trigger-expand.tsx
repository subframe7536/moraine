import { createTree } from '@src'

interface FileNode {
  id: string
  name: string
  children?: FileNode[]
}

const FILES: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    children: [
      {
        id: 'components',
        name: 'components',
        children: [
          { id: 'button', name: 'button.tsx' },
          { id: 'input', name: 'input.tsx' },
        ],
      },
      { id: 'index', name: 'index.ts' },
    ],
  },
  { id: 'package', name: 'package.json' },
  { id: 'readme', name: 'README.md' },
]

export function TriggerExpand() {
  const tree = createTree<FileNode>({
    items: () => FILES,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    defaultExpandedKeys: ['src'],
    expandOnClick: false,
  })

  return (
    <div class="max-w-sm w-full space-y-2">
      <tree.Tree
        aria-label="Project files"
        itemRender={(item) => (
          <tree.Item item={item}>
            <tree.ItemTrigger />
            <tree.ItemIcon icon={item.hasChildren ? 'icon-folder' : 'icon-file'} />
            <tree.ItemLabel />
          </tree.Item>
        )}
      />
      <p class="text-xs text-muted-foreground">
        Click the chevron to expand or collapse a folder. Clicking the row only selects it.
      </p>
    </div>
  )
}
