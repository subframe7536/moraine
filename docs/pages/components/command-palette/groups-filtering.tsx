import { CommandPalette } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal } from 'solid-js'
const COMMAND_GROUPS: CommandPaletteT.Group[] = [
  {
    type: 'group',
    label: 'Workspace sections',
    children: [
      {
        value: 'overview',
        label: 'Overview',
        description: 'Recent activity and open work',
        icon: 'i-lucide:layout-dashboard',
        kbds: ['meta', '1'],
      },
      {
        value: 'members',
        label: 'Members',
        description: 'People with workspace access',
        icon: 'i-lucide:users',
        kbds: ['meta', '2'],
      },
      {
        value: 'security',
        label: 'Security',
        description: 'Sign-in and access policies',
        icon: 'i-lucide:shield-check',
        kbds: ['meta', '3'],
      },
    ],
  },
]

export function GroupsFiltering() {
  const [section, setSection] = createSignal('overview')

  return (
    <div class="max-w-md w-full space-y-3">
      <CommandPalette
        autoFocus={false}
        placeholder="Find a workspace section..."
        items={COMMAND_GROUPS}
        onSelect={(item) => setSection(item.value)}
      />
      <p class="text-sm">Current section: {section()}</p>
    </div>
  )
}
