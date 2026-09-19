import { Avatar, Badge, Button, Icon, SidebarFrame } from '@src'
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
    <div class="mx-auto b b-border flex flex-col h-150 max-w-xs w-full overflow-hidden">
      <SidebarFrame isMobile>
        <SidebarFrame.Sidebar class="bg-card">
          <SidebarFrame.SidebarHeader class="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <div class="text-sm font-bold flex gap-2 items-center">
              <div class="text-white rounded-lg bg-emerald-600 flex size-7 items-center justify-center">
                <Icon name="i-lucide:wallet" class="size-4" />
              </div>
              <span>PocketPay</span>
            </div>
            <Badge size="sm" variant="subtle">
              v1.8
            </Badge>
          </SidebarFrame.SidebarHeader>

          <SidebarFrame.SidebarBody class="p-3 space-y-1">
            <div class="text-[10px] text-muted-foreground tracking-wider font-semibold px-2 py-1 uppercase">
              Navigation
            </div>
            <For each={mobileNav}>
              {(item) => (
                <a
                  href="#"
                  class={`text-xs font-medium px-3 py-2 rounded-lg flex transition-colors items-center justify-between ${
                    item.active
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <div class="flex gap-2.5 items-center">
                    <Icon name={item.icon} class="shrink-0 size-4" />
                    <span>{item.label}</span>
                  </div>
                  <Show when={item.badge}>
                    <Badge size="sm" variant="subtle">
                      {item.badge}
                    </Badge>
                  </Show>
                </a>
              )}
            </For>
          </SidebarFrame.SidebarBody>

          <SidebarFrame.SidebarFooter class="p-3 border-t border-border/60 flex items-center justify-between">
            <div class="flex gap-2 items-center">
              <Avatar text="ML" size="sm" />
              <div class="flex flex-col">
                <span class="text-xs font-medium">Marcus Lee</span>
                <span class="text-[10px] text-muted-foreground">Premier Account</span>
              </div>
            </div>
            <Button variant="ghost" size="icon-xs" aria-label="Sign out">
              <Icon name="i-lucide:log-out" class="size-3.5" />
            </Button>
          </SidebarFrame.SidebarFooter>
        </SidebarFrame.Sidebar>

        <SidebarFrame.Main class="bg-muted/10 flex flex-col h-full">
          {/* Mobile Shell Header */}
          <header class="px-3 py-2 border-b border-border/60 bg-background/80 flex shrink-0 items-center justify-between backdrop-blur">
            <SidebarFrame.Trigger
              as={Button}
              variant="ghost"
              size="icon-sm"
              aria-label="Open mobile menu"
            >
              <Icon name="i-lucide:menu" class="size-4" />
            </SidebarFrame.Trigger>

            <span class="text-xs font-semibold">PocketPay</span>

            <Button variant="ghost" size="icon-sm" aria-label="Notifications">
              <div class="relative">
                <Icon name="i-lucide:bell" class="size-4" />
                <span class="rounded-full bg-emerald-500 size-1.5 absolute -right-0.5 -top-0.5" />
              </div>
            </Button>
          </header>

          {/* Mobile Screen Body */}
          <div class="p-3 flex-1 overflow-y-auto space-y-3">
            {/* Balance Card */}
            <div class="text-white p-3.5 rounded-xl shadow-sm from-emerald-600 to-teal-700 bg-gradient-to-br space-y-2">
              <div class="text-[11px] opacity-80">Available Balance</div>
              <div class="text-xl tracking-tight font-bold">$24,580.45</div>
              <div class="text-[10px] opacity-90 flex gap-1 items-center">
                <Icon name="i-lucide:trending-up" class="size-3" />
                <span>+12.4% from last month</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div class="text-center gap-2 grid grid-cols-3">
              <button class="text-xs p-2 border border-border/60 rounded-lg bg-card flex flex-col gap-1 transition-colors items-center hover:bg-muted/60">
                <Icon name="i-lucide:arrow-up-right" class="text-emerald-600 size-4" />
                <span class="text-[11px] font-medium">Send</span>
              </button>
              <button class="text-xs p-2 border border-border/60 rounded-lg bg-card flex flex-col gap-1 transition-colors items-center hover:bg-muted/60">
                <Icon name="i-lucide:arrow-down-left" class="text-teal-600 size-4" />
                <span class="text-[11px] font-medium">Receive</span>
              </button>
              <button class="text-xs p-2 border border-border/60 rounded-lg bg-card flex flex-col gap-1 transition-colors items-center hover:bg-muted/60">
                <Icon name="i-lucide:credit-card" class="text-blue-600 size-4" />
                <span class="text-[11px] font-medium">Cards</span>
              </button>
            </div>

            {/* Recent Activity */}
            <div class="pt-1 space-y-1.5">
              <div class="text-[10px] text-muted-foreground tracking-wider font-semibold uppercase">
                Recent Transactions
              </div>
              <div class="border border-border/60 rounded-lg bg-card overflow-hidden divide-border/40 divide-y">
                <For each={transactions}>
                  {(tx) => (
                    <div class="text-xs p-2 flex items-center justify-between">
                      <div>
                        <div class="font-medium">{tx.name}</div>
                        <div class="text-[10px] text-muted-foreground">{tx.type}</div>
                      </div>
                      <span
                        class={`font-semibold ${
                          tx.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                        }`}
                      >
                        {tx.amount}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
