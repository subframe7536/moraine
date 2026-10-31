import { ContextMenu } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function ContextMenuPlayground() {
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
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <ContextMenu disabled={props.disabled} size={props.size}>
          <ContextMenu.Trigger as="div">
            <div class="text-xs text-muted-foreground border border-border/60 rounded-xl border-dashed bg-muted/20 flex h-36 max-w-full w-80 select-none items-center justify-center">
              Right click or long press here
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content
            items={[
              {
                type: 'group',
                label: 'Edit',
                children: [
                  { label: 'Cut', icon: 'i-lucide:scissors', kbds: ['⌘', 'X'] },
                  {
                    label: 'Copy',
                    description: 'Copy to the clipboard',
                    icon: 'i-lucide:copy',
                    kbds: ['⌘', 'C'],
                  },
                  { label: 'Paste', icon: 'i-lucide:clipboard', kbds: ['⌘', 'V'] },
                  {
                    label: 'Move to',
                    icon: 'i-lucide:folder-input',
                    children: [
                      { label: 'Inbox', icon: 'i-lucide:inbox' },
                      { label: 'Archive', icon: 'i-lucide:archive' },
                    ],
                  },
                ],
              },
              {
                type: 'group',
                children: [
                  { type: 'separator' },
                  {
                    type: 'checkbox',
                    label: 'Favorite',
                    icon: 'i-lucide:star',
                    defaultChecked: true,
                  },
                  { label: 'Delete', icon: 'i-lucide:trash-2', variant: 'danger' },
                ],
              },
            ]}
          />
        </ContextMenu>
      )}
    </DocsPlayground>
  )
}
