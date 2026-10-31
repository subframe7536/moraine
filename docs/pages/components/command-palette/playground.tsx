import { CommandPalette, Icon, Kbd, KbdGroup } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const GROUPS = [
  {
    id: 'workspace',
    label: 'Workspace Actions',
    items: [
      {
        value: 'new-issue',
        label: 'Create New Issue',
        leadingRender: () => <Icon name="i-lucide:circle-plus" />,
        trailingRender: () => <KbdGroup items={['⌘', 'N']} size="sm" />,
      },
      {
        value: 'open-inbox',
        label: 'Open Notifications',
        leadingRender: () => <Icon name="i-lucide:inbox" />,
        trailingRender: () => <KbdGroup items={['⌘', 'I']} size="sm" />,
      },
      {
        value: 'sync-roadmap',
        label: 'Sync Roadmap',
        leadingRender: () => <Icon name="i-lucide:refresh-cw" />,
        description: 'Pull the latest project updates',
      },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    items: [
      {
        value: 'go-dashboard',
        label: 'Dashboard Overview',
        leadingRender: () => <Icon name="i-lucide:layout-dashboard" />,
      },
      {
        value: 'go-projects',
        label: 'Projects Directory',
        leadingRender: () => <Icon name="i-lucide:folder-kanban" />,
      },
      {
        value: 'go-settings',
        label: 'Settings & Security',
        leadingRender: () => <Icon name="i-lucide:settings" />,
      },
    ],
  },
]

export default function CommandPalettePlayground() {
  return (
    <DocsPlayground
      controls={[{ kind: 'switch', prop: 'loading', label: 'Loading', defaultValue: false }]}
    >
      {(props) => (
        <div class="border border-border/60 rounded-xl bg-card/40 max-w-full w-lg shadow-xs overflow-hidden">
          <CommandPalette
            groups={GROUPS}
            placeholder="Search commands or pages..."
            loading={props.loading}
            autofocus={false}
            closable
            footerRender={() => (
              <div class="text-xs text-muted-foreground flex gap-4 items-center justify-between">
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
