import { createTree } from '@src'
import { createSignal } from 'solid-js'

interface Permission {
  id: string
  label: string
  children?: Permission[]
}

const PERMISSIONS: Permission[] = [
  {
    id: 'billing',
    label: 'Billing',
    children: [
      { id: 'billing-read', label: 'View invoices' },
      { id: 'billing-write', label: 'Manage payment methods' },
    ],
  },
  {
    id: 'members',
    label: 'Members',
    children: [
      { id: 'members-read', label: 'View members' },
      { id: 'members-invite', label: 'Invite members' },
      { id: 'members-remove', label: 'Remove members' },
    ],
  },
]

export function Checkable() {
  const [checked, setChecked] = createSignal<string[]>(['members-read'])
  const tree = createTree<Permission>({
    items: () => PERMISSIONS,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getTextValue: (node) => node.label,
    defaultExpandedKeys: ['billing', 'members'],
    checkable: true,
    selectionMode: 'none',
    get checkedKeys() {
      return checked()
    },
    onCheckedChange: setChecked,
  })

  return (
    <div class="max-w-sm w-full space-y-3">
      <tree.Tree aria-label="Role permissions" />
      <p class="text-xs text-muted-foreground">
        Checked leaves and branches:{' '}
        <span class="text-foreground font-medium">{checked().join(', ') || 'none'}</span>
      </p>
    </div>
  )
}
