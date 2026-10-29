import { Button, createTree } from '@src'
import { createSignal } from 'solid-js'

interface Section {
  id: string
  title: string
  children?: Section[]
}

const SECTIONS: Section[] = [
  {
    id: 'guides',
    title: 'Guides',
    children: [
      { id: 'install', title: 'Installation' },
      { id: 'theming', title: 'Theming' },
    ],
  },
  {
    id: 'components',
    title: 'Components',
    children: [
      {
        id: 'forms',
        title: 'Forms',
        children: [
          { id: 'input', title: 'Input' },
          { id: 'select', title: 'Select' },
        ],
      },
      { id: 'overlay', title: 'Overlay' },
    ],
  },
]

export function Expanded() {
  const [expanded, setExpanded] = createSignal<string[]>(['components'])
  const tree = createTree<Section>({
    items: () => SECTIONS,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.title,
    get expandedKeys() {
      return expanded()
    },
    onExpandedChange: setExpanded,
  })

  return (
    <div class="max-w-sm w-full space-y-3">
      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => tree.expandAll()}>
          Expand all
        </Button>
        <Button size="sm" variant="outline" onClick={() => tree.collapseAll()}>
          Collapse all
        </Button>
        <Button size="sm" variant="outline" onClick={() => tree.expandTo('select')}>
          Reveal Select
        </Button>
      </div>
      <tree.Tree aria-label="Documentation outline" />
      <p class="text-xs text-muted-foreground">
        Expanded: <span class="text-foreground font-medium">{expanded().join(', ') || 'none'}</span>
      </p>
    </div>
  )
}
