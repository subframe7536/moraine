import { Tabs } from '@src'

export function Orientations() {
  return (
    <div class="flex gap-8 w-2xl">
      <Tabs
        defaultValue="overview"
        orientation="horizontal"
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
        orientation="vertical"
        classes={{
          root: 'max-w-md',
          list: 'w-40',
        }}
        items={[
          {
            label: 'Overview',
            value: 'overview',
            icon: 'i-lucide:layout-dashboard',
            content: <p class="text-sm text-foreground w-sm">Overview panel content.</p>,
          },
          {
            label: 'Settings',
            value: 'settings',
            icon: 'i-lucide:settings',
            content: <p class="text-sm text-foreground w-sm">Settings panel content.</p>,
          },
          {
            label: 'Billing',
            value: 'billing',
            icon: 'i-lucide:credit-card',
            content: <p class="text-sm text-foreground w-sm">Billing panel content.</p>,
          },
        ]}
      />
    </div>
  )
}
