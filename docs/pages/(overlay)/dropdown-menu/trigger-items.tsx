import { Button, DropdownMenu } from '@src'

const ACTIONS = [
  { label: 'Edit profile', leading: 'i-lucide:user' },
  { label: 'Billing details', leading: 'i-lucide:credit-card' },
  { label: 'Keyboard shortcuts', leading: 'i-lucide:keyboard' },
]

export function TriggerItems() {
  return (
    <DropdownMenu items={ACTIONS}>
      {(props) => (
        <Button {...props} variant="outline" trailing="i-lucide:chevron-down">
          Account options
        </Button>
      )}
    </DropdownMenu>
  )
}
