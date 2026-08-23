import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'

export interface DropdownMenuPlaygroundProps {
  size?: DropdownMenuT.Variant['size']
  disabled?: boolean
}

export function DropdownMenuPlayground(props: DropdownMenuPlaygroundProps) {
  return (
    <DropdownMenu
      items={[
        {
          type: 'group',
          label: 'Account',
          children: [
            { label: 'Profile', icon: 'i-lucide:user' },
            { label: 'Billing', icon: 'i-lucide:credit-card' },
            { label: 'Settings', icon: 'i-lucide:settings', kbds: ['⌘', 'S'] },
          ],
        },
        {
          type: 'group',
          children: [{ label: 'Sign out', icon: 'i-lucide:log-out', color: 'destructive' }],
        },
      ]}
      size={props.size ?? 'md'}
      disabled={props.disabled ?? false}
    >
      {(triggerProps) => (
        <Button {...triggerProps} variant="outline" trailing="i-lucide:chevron-down">
          Account Actions
        </Button>
      )}
    </DropdownMenu>
  )
}
