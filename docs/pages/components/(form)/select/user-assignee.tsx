import { Select } from '@src'
import type { SelectT } from '@src'

const ROLES: SelectT.Item[] = [
  {
    label: 'Owner',
    value: 'owner',
    icon: 'i-lucide:crown',
    description: 'Full access to all resources and billing',
  },
  {
    label: 'Admin',
    value: 'admin',
    icon: 'i-lucide:shield',
    description: 'Can manage team members and settings',
  },
  {
    label: 'Member',
    value: 'member',
    icon: 'i-lucide:user',
    description: 'Can create and edit team projects',
  },
  {
    label: 'Viewer',
    value: 'viewer',
    icon: 'i-lucide:eye',
    description: 'Read-only access to published workflows',
  },
]

export function UserAssignee() {
  return (
    <div class="max-w-sm w-full space-y-2">
      <label class="text-xs text-muted-foreground font-medium block">Member Permission Role</label>
      <Select items={ROLES} defaultValue="member" placeholder="Assign a role..." />
    </div>
  )
}
