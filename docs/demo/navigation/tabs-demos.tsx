import { For, createSignal } from 'solid-js'

import { Button, Tabs } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Variants() {
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

function Orientation() {
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

function Sizes() {
  const SIZE_OPTIONS = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="w-xl space-y-4">
      <For each={SIZE_OPTIONS}>
        {(size) => (
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground tracking-wide uppercase">{size}</p>
            <Tabs
              size={size}
              defaultValue="overview"
              items={[
                {
                  label: 'Overview',
                  value: 'overview',
                  content: <p class="text-sm text-foreground">Overview</p>,
                },
                {
                  label: 'Metrics',
                  value: 'metrics',
                  content: <p class="text-sm text-foreground">Metrics</p>,
                },
                {
                  label: 'Activity',
                  value: 'activity',
                  content: <p class="text-sm text-foreground">Activity</p>,
                },
              ]}
            />
          </div>
        )}
      </For>
    </div>
  )
}

function ControlledDisabledItems() {
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
            content: <p class="text-sm text-foreground">Overview section with release status.</p>,
          },
          {
            label: 'Settings',
            value: 'settings',
            content: (
              <p class="text-sm text-foreground">Settings section with environment options.</p>
            ),
          },
          {
            label: 'Billing (Disabled)',
            value: 'billing',
            disabled: true,
            content: <p class="text-sm text-foreground">This panel is intentionally disabled.</p>,
          },
        ]}
      />
      <p class="text-xs text-muted-foreground">Current tab value: {value()}</p>
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="tabs">
      <DemoSection
        title="Variants"
        description="Pill and link visual variants for the tab list."
        demo={Variants}
      />

      <DemoSection
        title="Orientation"
        description="Horizontal and vertical orientation with the same items contract."
        demo={Orientation}
      />

      <DemoSection title="Sizes" description="Trigger size scale from xs to xl." demo={Sizes} />

      <DemoSection
        title="Controlled + Disabled Items"
        description="Controlled value with disabled tab options and external navigation controls."
        demo={ControlledDisabledItems}
      />
    </DemoPage>
  )
}
