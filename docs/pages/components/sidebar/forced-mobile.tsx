import { Avatar, Badge, Button, Icon, Sidebar } from '@src'
import { For, Show } from 'solid-js'

export function ForcedMobile() {
  const mobileNav = [
    { label: 'Overview', icon: 'i-lucide:home', active: true },
    { label: 'Cards & Wallets', icon: 'i-lucide:credit-card', badge: '3' },
    { label: 'Transfers & Payments', icon: 'i-lucide:arrow-left-right' },
    { label: 'Analytics & Insights', icon: 'i-lucide:pie-chart' },
    { label: 'Security & Limits', icon: 'i-lucide:shield-check' },
    { label: 'Customer Support', icon: 'i-lucide:message-square' },
  ]

  const transactions = [
    { name: 'Stripe Payout', type: 'Deposit', amount: '+$3,450.00', positive: true },
    { name: 'Figma Subscription', type: 'Software', amount: '-$15.00', positive: false },
    { name: 'Coffee Roasters', type: 'Food & Dining', amount: '-$6.25', positive: false },
  ]

  return (
    <div class="mx-auto b b-border rounded-xl flex flex-col h-150 max-w-xs w-full overflow-hidden">
      <Sidebar isMobile>
        <Sidebar.Panel>
          <Sidebar.Header>
            <div class="flex w-full items-center justify-between">
              <div class="text-sm font-bold flex gap-2 items-center">
                <div class="text-primary-foreground rounded-lg bg-primary flex size-7 items-center justify-center">
                  <Icon name="i-lucide:wallet" />
                </div>
                <span>PocketPay</span>
              </div>
              <Badge size="sm" variant="soft">
                v1.8
              </Badge>
            </div>
          </Sidebar.Header>

          <Sidebar.Content>
            <nav class="p-2 space-y-1">
              <div class="text-xs text-muted-foreground font-semibold px-2 py-1 uppercase">
                Navigation
              </div>
              <For each={mobileNav}>
                {(item) => (
                  <a
                    href="#"
                    class={`text-xs font-medium px-2 py-2 rounded-lg flex items-center justify-between ${
                      item.active
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div class="flex gap-2.5 items-center">
                      <span class="shrink-0">
                        <Icon name={item.icon} />
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <Show when={item.badge}>
                      <Badge size="sm" variant="soft">
                        {item.badge}
                      </Badge>
                    </Show>
                  </a>
                )}
              </For>
            </nav>
          </Sidebar.Content>

          <Sidebar.Footer>
            <div class="flex w-full items-center justify-between">
              <div class="flex gap-2 items-center">
                <Avatar text="ML" size="sm" />
                <div class="flex flex-col">
                  <span class="text-xs font-medium">Marcus Lee</span>
                  <span class="text-xs text-muted-foreground">Premier Account</span>
                </div>
              </div>
              <Button variant="ghost" size="icon-xs" aria-label="Sign out">
                <Icon name="i-lucide:log-out" />
              </Button>
            </div>
          </Sidebar.Footer>
        </Sidebar.Panel>

        <Sidebar.Inset>
          <div class="flex flex-col h-full">
            <header class="px-3 py-2 border-b border-border bg-background flex shrink-0 items-center justify-between">
              <Sidebar.Trigger
                as={Button}
                variant="ghost"
                size="icon-sm"
                aria-label="Open mobile menu"
              >
                <Icon name="i-lucide:menu" />
              </Sidebar.Trigger>

              <span class="text-xs font-semibold">PocketPay</span>

              <Button variant="ghost" size="icon-sm" aria-label="Notifications">
                <Icon name="i-lucide:bell" />
              </Button>
            </header>

            <div class="p-3 flex-1 overflow-y-auto space-y-3">
              <div class="text-primary-foreground p-3.5 rounded-xl bg-primary space-y-2">
                <div class="text-xs opacity-80">Available Balance</div>
                <div class="text-xl tracking-tight font-bold">$24,580.45</div>
                <div class="text-xs opacity-90 flex gap-1 items-center">
                  <Icon name="i-lucide:trending-up" />
                  <span>+12.4% from last month</span>
                </div>
              </div>

              <div class="text-center gap-2 grid grid-cols-3">
                <button class="text-xs p-2 border border-border rounded-lg bg-card flex flex-col gap-1 items-center hover:bg-muted">
                  <Icon name="i-lucide:arrow-up-right" />
                  <span class="text-xs font-medium">Send</span>
                </button>
                <button class="text-xs p-2 border border-border rounded-lg bg-card flex flex-col gap-1 items-center hover:bg-muted">
                  <Icon name="i-lucide:arrow-down-left" />
                  <span class="text-xs font-medium">Receive</span>
                </button>
                <button class="text-xs p-2 border border-border rounded-lg bg-card flex flex-col gap-1 items-center hover:bg-muted">
                  <Icon name="i-lucide:credit-card" />
                  <span class="text-xs font-medium">Cards</span>
                </button>
              </div>

              <div class="pt-1 space-y-1.5">
                <div class="text-xs text-muted-foreground font-semibold uppercase">
                  Recent Transactions
                </div>
                <div class="border border-border rounded-lg bg-card overflow-hidden divide-border divide-y">
                  <For each={transactions}>
                    {(tx) => (
                      <div class="text-xs p-2 flex items-center justify-between">
                        <div>
                          <div class="font-medium">{tx.name}</div>
                          <div class="text-xs text-muted-foreground">{tx.type}</div>
                        </div>
                        <span class={tx.positive ? 'text-success font-semibold' : 'font-semibold'}>
                          {tx.amount}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </div>
        </Sidebar.Inset>
      </Sidebar>
    </div>
  )
}
