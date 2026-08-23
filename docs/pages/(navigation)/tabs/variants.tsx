import { Tabs } from '@src'

export function Variants() {
  return (
    <div class="flex flex-col gap-8 w-xl">
      <Tabs
        defaultValue="overview"
        variant="pill"
        items={[
          {
            label: 'Overview',
            value: 'overview',
            icon: 'i-lucide:layout-dashboard',
            content: <p class="text-sm text-foreground">Overview panel content.</p>,
          },
          {
            label: 'Settings',
            value: 'settings',
            icon: 'i-lucide:settings',
            content: <p class="text-sm text-foreground">Settings panel content.</p>,
          },
          {
            label: 'Billing',
            value: 'billing',
            icon: 'i-lucide:credit-card',
            content: <p class="text-sm text-foreground">Billing panel content.</p>,
          },
        ]}
      />
      <Tabs
        defaultValue="settings"
        variant="link"
        items={[
          {
            label: 'Overview',
            value: 'overview',
            icon: 'i-lucide:layout-dashboard',
            content: <p class="text-sm text-foreground">Overview panel content.</p>,
          },
          {
            label: 'Settings',
            value: 'settings',
            icon: 'i-lucide:settings',
            content: <p class="text-sm text-foreground">Settings panel content.</p>,
          },
          {
            label: 'Billing',
            value: 'billing',
            icon: 'i-lucide:credit-card',
            content: <p class="text-sm text-foreground">Billing panel content.</p>,
          },
        ]}
      />
    </div>
  )
}
