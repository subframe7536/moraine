import { Badge, Button, Input, Tabs } from '@src'

export function Variants() {
  const getTabItems = () => [
    {
      label: 'Overview',
      value: 'overview',
      icon: 'i-lucide:layout-dashboard',
      content: (
        <div class="mt-3 p-4 b-(1 border) rounded-xl bg-card space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">Production Status</span>
            <Badge variant="solid" size="sm">
              Operational
            </Badge>
          </div>
          <p class="text-xs text-muted-foreground">
            All 12 microservices and database read-replicas are healthy. Average latency is 24ms.
          </p>
        </div>
      ),
    },
    {
      label: 'Settings',
      value: 'settings',
      icon: 'i-lucide:settings',
      content: (
        <div class="mt-3 p-4 b-(1 border) rounded-xl bg-card space-y-3">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground font-medium">Display Name</label>
            <Input size="sm" defaultValue="Alex Morgan" />
          </div>
          <Button size="sm" variant="default">
            Save Preferences
          </Button>
        </div>
      ),
    },
    {
      label: 'Billing',
      value: 'billing',
      icon: 'i-lucide:credit-card',
      content: (
        <div class="mt-3 p-4 b-(1 border) rounded-xl bg-card space-y-3">
          <div class="text-xs flex items-center justify-between">
            <span class="font-medium">Pro Team Plan</span>
            <span class="text-primary font-mono font-semibold">$49.00 / month</span>
          </div>
          <p class="text-xs text-muted-foreground">Next billing date: November 15, 2026.</p>
        </div>
      ),
    },
  ]

  return (
    <div class="flex flex-col gap-8 max-w-xl w-full">
      <div class="space-y-1">
        <span class="text-xs text-muted-foreground tracking-wider font-medium uppercase">
          Pill Variant
        </span>
        <Tabs defaultValue="overview" variant="pill" items={getTabItems()} />
      </div>

      <div class="space-y-1">
        <span class="text-xs text-muted-foreground tracking-wider font-medium uppercase">
          Link Variant
        </span>
        <Tabs defaultValue="settings" variant="link" items={getTabItems()} />
      </div>
    </div>
  )
}
