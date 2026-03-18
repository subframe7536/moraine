import { createSignal } from 'solid-js'

import { Tabs } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

export default () => {
  const [value, setValue] = createSignal('overview')

  return (
    <DemoPage componentKey="tabs">
      <DemoSection
        title="Uncontrolled"
        description="Default value with icon-leading triggers and panel content."
      >
        <Tabs
          defaultValue="overview"
          items={[
            {
              label: 'Overview',
              value: 'overview',
              icon: 'i-lucide:layout-dashboard',
              content: <p class="text-sm text-zinc-700">Overview panel content.</p>,
            },
            {
              label: 'Settings',
              value: 'settings',
              icon: 'i-lucide:settings',
              content: <p class="text-sm text-zinc-700">Settings panel content.</p>,
            },
            {
              label: 'Billing',
              value: 'billing',
              icon: 'i-lucide:credit-card',
              content: <p class="text-sm text-zinc-700">Billing panel content.</p>,
            },
          ]}
        />
      </DemoSection>

      <DemoSection title="Controlled" description="External state through value and onChange.">
        <div class="space-y-3">
          <Tabs
            value={value()}
            onChange={setValue}
            variant="link"
            items={[
              {
                label: 'One',
                value: 'one',
                content: <p class="text-sm text-zinc-700">First tab.</p>,
              },
              {
                label: 'Two',
                value: 'two',
                content: <p class="text-sm text-zinc-700">Second tab.</p>,
              },
              {
                label: 'Three',
                value: 'three',
                content: <p class="text-sm text-zinc-700">Third tab.</p>,
              },
            ]}
          />
          <p class="text-xs text-zinc-600">Current tab: {value()}</p>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
