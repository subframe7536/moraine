import { Button, Tabs } from '@src'
import { createSignal } from 'solid-js'

export function ControlledDisabledItems() {
  const [value, setValue] = createSignal('overview')

  return (
    <div class="space-y-3">
      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setValue('overview')}>
          Go overview
        </Button>
        <Button size="sm" variant="outline" onClick={() => setValue('settings')}>
          Go settings
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setValue('billing')}>
          Try disabled billing
        </Button>
      </div>

      <Tabs
        value={value()}
        onChange={setValue}
        variant="link"
        items={[
          {
            label: 'Overview',
            value: 'overview',
            content: <p class="text-foreground text-sm">Overview section with release status.</p>,
          },
          {
            label: 'Settings',
            value: 'settings',
            content: (
              <p class="text-foreground text-sm">Settings section with environment options.</p>
            ),
          },
          {
            label: 'Billing (Disabled)',
            value: 'billing',
            disabled: true,
            content: <p class="text-foreground text-sm">This panel is intentionally disabled.</p>,
          },
        ]}
      />
      <p class="text-muted-foreground text-xs">Current tab value: {value()}</p>
    </div>
  )
}
