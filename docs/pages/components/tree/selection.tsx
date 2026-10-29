import { createTree } from '@src'
import { createSignal } from 'solid-js'

interface Folder {
  id: string
  name: string
  children?: Folder[]
}

const FOLDERS: Folder[] = [
  {
    id: 'inbox',
    name: 'Inbox',
    children: [
      { id: 'invoices', name: 'Invoices' },
      { id: 'receipts', name: 'Receipts' },
    ],
  },
  {
    id: 'projects',
    name: 'Projects',
    children: [
      { id: 'moraine', name: 'Moraine' },
      { id: 'atlas', name: 'Atlas' },
    ],
  },
  { id: 'archive', name: 'Archive' },
]

export function Selection() {
  const [selected, setSelected] = createSignal<string[]>(['moraine'])
  const tree = createTree<Folder>({
    items: () => FOLDERS,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    defaultExpandedKeys: ['inbox', 'projects'],
    selectionMode: 'multiple',
    expandOnClick: false,
    get selectedKeys() {
      return selected()
    },
    onSelectionChange: setSelected,
  })

  return (
    <div class="max-w-sm w-full space-y-3">
      <tree.Tree aria-label="Mail folders" variant="solid" />
      <p class="text-xs text-muted-foreground">
        Click to select, hold <kbd>Ctrl</kbd> to toggle, and hold <kbd>Shift</kbd> to select a
        range. Selected:{' '}
        <span class="text-foreground font-medium">{selected().join(', ') || 'none'}</span>
      </p>
    </div>
  )
}
