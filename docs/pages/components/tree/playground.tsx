import { Checkbox, createTree } from '@src'
import { Show } from 'solid-js'

interface FileNode {
  id: string
  name: string
  children?: FileNode[]
  disabled?: boolean
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
          { id: 'checkbox', name: 'checkbox.tsx' },
          { id: 'tree', name: 'tree.tsx' },
        ],
      },
      { id: 'index', name: 'index.ts' },
    ],
  },
  { id: 'docs', name: 'docs', children: [{ id: 'guide', name: 'guide.md' }] },
  { id: 'package', name: 'package.json' },
  { id: 'license', name: 'LICENSE', disabled: true },
]

export function PlaygroundTree(props: {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'subtle' | 'solid'
  checkable?: boolean
  transition?: boolean
}) {
  const tree = createTree<FileNode>({
    items: () => FILES,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    isDisabled: (node) => Boolean(node.disabled),
    defaultExpandedKeys: ['src', 'components'],
    defaultSelectedKeys: ['tree'],
    get checkable() {
      return Boolean(props.checkable)
    },
  })

  return (
    <div class="max-w-sm w-full">
      <tree.Tree
        aria-label="Project files"
        size={props.size}
        variant={props.variant}
        transition={props.transition}
        itemRender={(context) => (
          <tree.Item item={context.item}>
            <tree.ItemTrigger />
            <Show when={props.checkable}>
              <Checkbox {...context.item.getCheckboxProps()} size={props.size} />
            </Show>
            <tree.ItemIcon
              icon={
                context.item.hasChildren
                  ? context.item.isExpanded
                    ? 'icon-folder-open'
                    : 'icon-folder'
                  : 'icon-file'
              }
            />
            <tree.ItemLabel />
          </tree.Item>
        )}
      />
    </div>
  )
}
