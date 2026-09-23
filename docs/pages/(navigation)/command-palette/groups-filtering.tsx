import { CommandPalette, Icon } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal } from 'solid-js'

const COMMAND_GROUPS: CommandPaletteT.Group[] = [
  {
    id: 'workspace',
    label: 'Workspace sections',
    items: [
      {
        value: 'overview',
        label: 'Overview',
        description: 'Recent activity and open work',
        leadingRender: () => <Icon name="i-lucide:layout-dashboard" />,
      },
      {
        value: 'members',
        label: 'Members',
        description: 'People with workspace access',
        leadingRender: () => <Icon name="i-lucide:users" />,
      },
      {
        value: 'security',
        label: 'Security',
        description: 'Sign-in and access policies',
        leadingRender: () => <Icon name="i-lucide:shield-check" />,
      },
    ],
  },
]

export function GroupsFiltering() {
  const [section, setSection] = createSignal('overview')

  return (
    <div class="max-w-md w-full space-y-3">
      <CommandPalette
        autofocus={false}
        placeholder="Find a workspace section..."
        groups={COMMAND_GROUPS}
        onSelect={(item) => setSection(item.value)}
      />
      <p class="text-sm">Current section: {section()}</p>
    </div>
  )
}
