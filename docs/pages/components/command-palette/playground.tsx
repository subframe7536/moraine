import { CommandPalette, Kbd, KbdGroup } from '@src'
import type { CommandPaletteT } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const GROUPS: CommandPaletteT.Group[] = [
  {
    type: 'group',
    label: 'Workspace Actions',
    children: [
      {
        value: 'new-issue',
        label: 'Create New Issue',
        icon: 'i-lucide:circle-plus',
        kbds: ['meta', 'N'],
      },
      {
        value: 'open-inbox',
        label: 'Open Notifications',
        icon: 'i-lucide:inbox',
        kbds: ['meta', 'I'],
      },
      {
        value: 'sync-roadmap',
        label: 'Sync Roadmap',
        icon: 'i-lucide:refresh-cw',
        description: 'Pull the latest project updates',
      },
    ],
  },
  {
    type: 'group',
    label: 'Navigation',
    children: [
      {
        value: 'go-dashboard',
        label: 'Dashboard Overview',
        icon: 'i-lucide:layout-dashboard',
      },
      {
        value: 'go-projects',
        label: 'Projects Directory',
        icon: 'i-lucide:folder-kanban',
      },
      {
        value: 'go-settings',
        label: 'Settings & Security',
        icon: 'i-lucide:settings',
      },
    ],
  },
]

export default function CommandPalettePlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'descriptionPosition',
          label: 'Description Position',
          defaultValue: 'bottom',
          options: [
            { label: 'Bottom', value: 'bottom' },
            { label: 'Trailing', value: 'trailing' },
          ],
        },
        { kind: 'switch', prop: 'closable', label: 'Closable', defaultValue: true },
        { kind: 'switch', prop: 'loading', label: 'Loading', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="max-w-full w-lg">
          <CommandPalette
            items={GROUPS}
            placeholder="Search commands or pages..."
            descriptionPosition={props.descriptionPosition}
            closable={props.closable}
            loading={props.loading}
            autoFocus={false}
            footerRender={() => (
              <div class="text-xs text-muted-foreground flex gap-4 w-full items-center justify-between">
                <div class="flex flex-wrap gap-3 items-center">
                  <div class="flex gap-1.5 items-center">
                    <KbdGroup items={['↑', '↓']} size="sm" />
                    <span>Navigate</span>
                  </div>
                  <div class="flex gap-1.5 items-center">
                    <Kbd value="enter" size="sm" />
                    <span>Select</span>
                  </div>
                </div>
                <div class="flex gap-1.5 items-center">
                  <Kbd value="escape" size="sm" />
                  <span>Close</span>
                </div>
              </div>
            )}
          />
        </div>
      )}
    </DocsPlayground>
  )
}
