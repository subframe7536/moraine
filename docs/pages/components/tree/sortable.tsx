import { Icon, createTree } from '@src'
import { createTreeSortable, moveTreeNode } from '@src/dnd'
import { createSignal } from 'solid-js'

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
      { id: 'app', name: 'app.tsx' },
      { id: 'routes', name: 'routes', children: [{ id: 'home', name: 'home.tsx' }] },
    ],
  },
  { id: 'docs', name: 'docs', children: [{ id: 'guide', name: 'guide.md' }] },
  { id: 'readme', name: 'README.md' },
  { id: 'license', name: 'LICENSE' },
]

const ACCESS = {
  getKey: (node: FileNode) => node.id,
  getChildren: (node: FileNode) => node.children,
  withChildren: (node: FileNode, children: FileNode[]) => ({ ...node, children }),
}

export function Sortable() {
  const [files, setFiles] = createSignal(FILES)

  const tree = createTree<FileNode>({
    items: files,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    defaultExpandedKeys: ['src'],
  })
  const sortable = createTreeSortable(tree, {
    // Only folders accept children; files take drops before or after them.
    canNest: (item) => item.raw.children !== undefined,
    onMove: (event) => setFiles((current) => moveTreeNode(current, event, ACCESS)),
  })

  return (
    <div class="max-w-sm w-full">
      <sortable.Provider>
        <tree.Tree
          aria-label="Project files"
          itemRender={(item) => {
            const node = sortable.useNode(item)
            return (
              <tree.Item item={item} {...node.props}>
                <tree.ItemTrigger />
                <tree.ItemIcon icon={item.raw.children ? 'i-lucide:folder' : 'i-lucide:file'} />
                <tree.ItemLabel />
                <button
                  ref={node.handleRef}
                  type="button"
                  aria-label={`Move ${item.raw.name}`}
                  class="text-muted-foreground ms-auto rounded-sm flex size-6 cursor-grab items-center justify-center hover:bg-accent"
                >
                  <Icon name="i-lucide:grip-vertical" />
                </button>
              </tree.Item>
            )
          }}
        />
      </sortable.Provider>
    </div>
  )
}
