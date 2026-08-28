import { Tabs } from '@src'
import { createSignal } from 'solid-js'

const TAB_ITEMS = [
  {
    value: 'account',
    label: 'Account',
    children: (
      <div class="text-xs text-muted-foreground p-3">
        Manage your account preferences and email address.
      </div>
    ),
  },
  {
    value: 'password',
    label: 'Password',
    children: (
      <div class="text-xs text-muted-foreground p-3">
        Change your password and two-factor authentication.
      </div>
    ),
  },
  {
    value: 'billing',
    label: 'Billing',
    children: (
      <div class="text-xs text-muted-foreground p-3">View past invoices and payment methods.</div>
    ),
  },
]

export function SelectionUsage() {
  const [tab, setTab] = createSignal('account')

  return (
    <div class="max-w-md w-full space-y-3">
      <Tabs items={TAB_ITEMS} value={tab()} onChange={setTab} />
      <p class="text-xs text-muted-foreground">
        Active tab: <span class="text-foreground font-medium">{tab()}</span>
      </p>
    </div>
  )
}
