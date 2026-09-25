import { Tabs } from '@src'
import type { TabsT } from '@src'
import { createSignal } from 'solid-js'

const TAB_ITEMS: TabsT.Item[] = [
  {
    value: 'account',
    label: 'Account',
    icon: 'i-lucide:user',
    content: (
      <div class="text-muted-foreground mt-2 p-3 b-1 b-border bg-card/40 text-xs rounded-lg">
        Manage your account preferences, profile details, and email notifications.
      </div>
    ),
  },
  {
    value: 'security',
    label: 'Security',
    icon: 'i-lucide:shield',
    content: (
      <div class="text-muted-foreground mt-2 p-3 b-1 b-border bg-card/40 text-xs rounded-lg">
        Configure two-factor authentication, active sessions, and API tokens.
      </div>
    ),
  },
  {
    value: 'billing',
    label: 'Billing',
    icon: 'i-lucide:credit-card',
    content: (
      <div class="text-muted-foreground mt-2 p-3 b-1 b-border bg-card/40 text-xs rounded-lg">
        View past invoices, payment methods, and current subscription usage.
      </div>
    ),
  },
]

export function SelectionUsage() {
  const [tab, setTab] = createSignal('account')

  return (
    <div class="max-w-md w-full space-y-3">
      <Tabs items={TAB_ITEMS} value={tab()} onChange={setTab} />
      <p class="text-muted-foreground text-xs">
        Active tab: <span class="text-foreground font-medium font-mono">{tab()}</span>
      </p>
    </div>
  )
}
