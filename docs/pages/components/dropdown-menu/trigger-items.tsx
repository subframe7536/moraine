import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'
const ACTIONS = [
  { label: 'Edit profile', icon: 'i-lucide:user' },
  { label: 'Billing details', icon: 'i-lucide:credit-card' },
  { label: 'Keyboard shortcuts', icon: 'i-lucide:keyboard' },
] satisfies DropdownMenuT.Item[]

export function TriggerItems() {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger as={Button} variant="outline" trailing="i-lucide:chevron-down">
        Account options
      </DropdownMenu.Trigger>
      <DropdownMenu.Content items={ACTIONS} />
    </DropdownMenu>
  )
}
