import { renderToString } from 'solid-js/web'

import { createTree } from './create-tree'

interface Node {
  id: string
  name: string
  children?: Node[]
}

const DATA: Node[] = [
  {
    id: 'src',
    name: 'src',
    children: [
      { id: 'index', name: 'index.ts' },
      { id: 'tree', name: 'tree.tsx' },
    ],
  },
  { id: 'docs', name: 'docs', children: [{ id: 'guide', name: 'guide.md' }] },
  { id: 'readme', name: 'README.md' },
]

export function TreeHydrationFixture(props: { checkable?: boolean }) {
  const tree = createTree<Node>({
    items: () => DATA,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    defaultExpandedKeys: ['src'],
    defaultSelectedKeys: ['readme'],
    get checkable() {
      return props.checkable
    },
  })

  return <tree.Tree aria-label="Files" />
}

export function renderTreeFixture(): string {
  return renderToString(() => <TreeHydrationFixture />)
}

export function renderCheckableTreeFixture(): string {
  return renderToString(() => <TreeHydrationFixture checkable />)
}
