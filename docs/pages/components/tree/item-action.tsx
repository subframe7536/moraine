import { Button, DropdownMenu, createTree } from '@src'
import { Show, createSignal } from 'solid-js'

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
  { id: 'docs', name: 'docs', children: [{ id: 'guide', name: 'guide.md' }] },
  { id: 'package', name: 'package.json' },
  { id: 'readme', name: 'README.md' },
]

export function ItemAction() {
  const [status, setStatus] = createSignal('Hover a row to show its actions.')
  const tree = createTree<FileNode>({
    items: () => FILES,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.name,
    getIcon: (item) => (item.hasChildren ? 'i-lucide:folder' : 'i-lucide:file'),
    defaultExpandedKeys: ['src', 'components'],
  })

  return (
    <div class="max-w-sm w-full space-y-2">
      <tree.Tree
        aria-label="Files"
        actionRender={(item) => (
          <>
            <Show when={item.hasChildren}>
              <Button
                variant="ghost"
                size="icon-xs"
                leading="i-lucide:file-plus"
                aria-label={`New file in ${item.textValue}`}
                onClick={() => setStatus(`New file in ${item.textValue}`)}
              />
            </Show>
            <DropdownMenu>
              <DropdownMenu.Trigger
                as={Button}
                variant="ghost"
                size="icon-xs"
                leading="i-lucide:ellipsis"
                aria-label={`More actions for ${item.textValue}`}
              />
              <DropdownMenu.Content
                items={[
                  {
                    label: 'Rename',
                    icon: 'i-lucide:pencil',
                    onSelect: () => setStatus(`Rename ${item.textValue}`),
                  },
                  {
                    label: 'Delete',
                    icon: 'i-lucide:trash-2',
                    onSelect: () => setStatus(`Delete ${item.textValue}`),
                  },
                ]}
              />
            </DropdownMenu>
          </>
        )}
      />
      <p role="status" class="text-xs text-muted-foreground">
        {status()}
      </p>
    </div>
  )
}
