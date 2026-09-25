import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createSignal } from 'solid-js'

const PERMISSION_GROUPS: MultiSelectT.Entry[] = [
  {
    label: 'User Management',
    type: 'group',
    items: [
      { label: 'Invite Members', value: 'users:invite', icon: 'i-lucide:user-plus' },
      { label: 'Edit Roles', value: 'users:roles', icon: 'i-lucide:shield' },
      { label: 'Remove Members', value: 'users:remove', icon: 'i-lucide:user-minus' },
    ],
  },
  {
    label: 'Content Management',
    type: 'group',
    items: [
      { label: 'Create Articles', value: 'content:create', icon: 'i-lucide:file-plus' },
      { label: 'Publish Content', value: 'content:publish', icon: 'i-lucide:send' },
      { label: 'Delete Content', value: 'content:delete', icon: 'i-lucide:trash-2' },
    ],
  },
  {
    label: 'Billing & Settings',
    type: 'group',
    items: [
      { label: 'View Invoices', value: 'billing:view', icon: 'i-lucide:receipt' },
      { label: 'Modify Subscriptions', value: 'billing:edit', icon: 'i-lucide:credit-card' },
    ],
  },
]

export function GroupedItems() {
  const [selected, setSelected] = createSignal(['users:invite', 'content:publish'])

  return (
    <div class="max-w-md w-full space-y-2">
      <label class="text-muted-foreground font-medium block text-xs">Role Permissions</label>
      <MultiSelect
        placeholder="Select permissions..."
        items={PERMISSION_GROUPS}
        value={selected()}
        onValueChange={setSelected}
        search
        openOnControlClick
        allowClear
      />
    </div>
  )
}
