import { createTree } from '@src'

interface Directory {
  id: string
  name: string
  hasChildren?: boolean
  children?: Directory[]
}

const REMOTE: Record<string, Directory[]> = {
  root: [
    { id: 'design', name: 'Design', hasChildren: true },
    { id: 'engineering', name: 'Engineering', hasChildren: true },
    { id: 'notes', name: 'notes.txt' },
  ],
  design: [
    { id: 'brand', name: 'Brand', hasChildren: true },
    { id: 'wireframes', name: 'wireframes.fig' },
  ],
  engineering: [
    { id: 'api', name: 'api.md' },
    { id: 'infra', name: 'infra.md' },
  ],
  brand: [{ id: 'logo', name: 'logo.svg' }],
}

function fetchChildren(id: string): Promise<Directory[]> {
  return new Promise((resolve) => setTimeout(() => resolve(REMOTE[id] ?? []), 900))
}

export function AsyncLoad() {
  const tree = createTree<Directory>({
    items: () => REMOTE.root!,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    isLeaf: (node) => !node.hasChildren,
    loadChildren: (node) => fetchChildren(node.id),
  })

  return (
    <div class="max-w-sm w-full">
      <tree.Tree aria-label="Remote files" />
    </div>
  )
}
