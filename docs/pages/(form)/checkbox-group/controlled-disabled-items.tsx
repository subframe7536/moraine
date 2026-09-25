import { CheckboxGroup } from '@src'
import { createSignal } from 'solid-js'

export function ControlledDisabledItems() {
  const ROLES = [
    { value: 'viewer', label: 'Viewer', description: 'Read-only access to repositories' },
    { value: 'developer', label: 'Developer', description: 'Can push commits and create PRs' },
    { value: 'maintainer', label: 'Maintainer', description: 'Can merge PRs and manage releases' },
    {
      value: 'owner',
      label: 'Owner (Immutable)',
      description: 'Primary organization administrator',
      disabled: true,
    },
  ]

  const [value, setValue] = createSignal<string[]>(['developer', 'owner'])

  return (
    <div class="p-4 b-(1 border) max-w-xl space-y-4 rounded-xl">
      <CheckboxGroup
        legend="Team member role permissions"
        variant="card"
        items={ROLES}
        value={value()}
        onValueChange={setValue}
      />
      <p class="text-muted-foreground text-xs">
        Active roles: <span class="text-foreground font-medium">{value().join(', ')}</span>
      </p>
    </div>
  )
}
