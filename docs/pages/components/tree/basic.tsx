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

export function Basic() {
  const tree = createTree<FileNode>({
    items: () => FILES,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    defaultExpandedKeys: ['src'],
  })

  return (
    <div class="max-w-sm w-full">
      <tree.Tree aria-label="Project files" />
    </div>
  )
}
