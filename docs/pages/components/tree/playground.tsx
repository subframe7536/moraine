import { Button, DropdownMenu, createTree } from '@src'
import type { TreeT } from '@src'
import { Show, createSignal } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

interface FileNode {
  id: string
  name: string
  disabled?: boolean
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

export default function TreePlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'subtle',
          options: [
            { label: 'Subtle', value: 'subtle' },
            { label: 'Solid', value: 'solid' },
          ],
        },
        { kind: 'switch', prop: 'expandIcon', label: 'Expand icon', defaultValue: true },
        { kind: 'switch', prop: 'icon', label: 'Item icon', defaultValue: true },
        { kind: 'switch', prop: 'checkable', label: 'Checkable', defaultValue: false },
        { kind: 'switch', prop: 'action', label: 'Actions', defaultValue: false },
        { kind: 'switch', prop: 'transition', label: 'Transition', defaultValue: true },
        { kind: 'switch', prop: 'indentGuide', label: 'Indent guide', defaultValue: true },
      ]}
    >
      {(props) => {
        const [status, setStatus] = createSignal('')

        const tree = createTree<FileNode>({
          items: () => FILES,
          getKey: (node) => node.id,
          getChildren: (node) => node.children,
          getItemLabel: (node) => node.name,
          isItemDisabled: (node) => Boolean(node.disabled),
          defaultExpandedKeys: ['src', 'components'],
          defaultSelectedKeys: ['tree'],
          get checkable() {
            return props.checkable
          },
        })

        const getItemIcon = (item: TreeT.ItemInstance<FileNode>) => {
          if (!props.icon) {
            return undefined
          }
          if (!item.hasChildren) {
            return 'i-lucide:file'
          }
          return item.expanded ? 'i-lucide:folder-open' : 'i-lucide:folder'
        }

        const actionRender = (item: TreeT.ItemInstance<FileNode>) => (
          <>
            <Show when={item.hasChildren}>
              <Button
                variant="ghost"
                size="icon-xs"
                leading="i-lucide:file-plus"
                tabIndex={item.focused ? 0 : -1}
                aria-label={`New file in ${item.label}`}
                onClick={() => setStatus(`New file in ${item.label}`)}
              />
            </Show>
            <DropdownMenu>
              <DropdownMenu.Trigger
                as={Button}
                variant="ghost"
                size="icon-xs"
                leading="i-lucide:ellipsis"
                tabIndex={item.focused ? 0 : -1}
                aria-label={`More actions for ${item.label}`}
              />
              <DropdownMenu.Content
                items={[
                  {
                    label: 'Rename',
                    icon: 'i-lucide:pencil',
                    onSelect: () => setStatus(`Rename ${item.label}`),
                  },
                  {
                    label: 'Delete',
                    icon: 'i-lucide:trash-2',
                    onSelect: () => setStatus(`Delete ${item.label}`),
                  },
                ]}
              />
            </DropdownMenu>
          </>
        )

        return (
          <div class="max-w-sm w-full space-y-2">
            <tree.Tree
              aria-label="Project files"
              size={props.size}
              variant={props.variant}
              transition={props.transition}
              indentGuide={props.indentGuide}
              expandIcon={props.expandIcon ? undefined : false}
              getItemIcon={getItemIcon}
              actionRender={props.action ? actionRender : undefined}
            />
            <Show when={status()}>
              <p class="text-xs text-muted-foreground">{status()}</p>
            </Show>
          </div>
        )
      }}
    </DocsPlayground>
  )
}
