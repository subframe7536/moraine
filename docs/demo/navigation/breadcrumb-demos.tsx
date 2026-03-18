import { createSignal } from 'solid-js'

import { Breadcrumb, Button } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const DEFAULT_ITEMS = [
  { label: 'Home', href: '#', icon: 'i-lucide:house' },
  { label: 'Library', href: '#', icon: 'i-lucide:folder' },
  { label: 'Components', href: '#', icon: 'i-lucide:box' },
  { label: 'Breadcrumb', href: '#', icon: 'i-lucide:bell-ring', active: true },
]

export default () => {
  const [wrap, setWrap] = createSignal(true)

  return (
    <DemoPage componentKey="breadcrumb">
      <DemoSection title="Default" description="Simple breadcrumb trail with active last item.">
        <Breadcrumb items={DEFAULT_ITEMS} />
      </DemoSection>

      <DemoSection
        title="Custom Separator + Disabled"
        description="Use an alternative separator and mark links as disabled."
      >
        <Breadcrumb
          separator={() => '/'}
          classes={{
            separator: 'size-unset',
          }}
          items={[
            { label: 'Workspace', href: '#', icon: 'i-lucide:briefcase' },
            { label: 'Settings', href: '#', icon: 'i-lucide:settings' },
            { label: 'Danger Zone', href: '#', disabled: true, icon: 'i-lucide:triangle-alert' },
          ]}
        />
      </DemoSection>
      <DemoSection title="Size" description="Different size.">
        <Breadcrumb
          size="sm"
          items={[
            { label: 'Workspace', href: '#', icon: 'i-lucide:briefcase' },
            { label: 'Settings', href: '#', icon: 'i-lucide:settings' },
            { label: 'Danger Zone', href: '#', disabled: true, icon: 'i-lucide:triangle-alert' },
          ]}
        />
        <Breadcrumb
          size="lg"
          items={[
            { label: 'Workspace', href: '#', icon: 'i-lucide:briefcase' },
            { label: 'Settings', href: '#', icon: 'i-lucide:settings' },
            { label: 'Danger Zone', href: '#', disabled: true, icon: 'i-lucide:triangle-alert' },
          ]}
        />
      </DemoSection>

      <DemoSection
        title="Wrapping"
        description="Toggle wrapping behavior for long breadcrumb labels."
      >
        <div class="space-y-3">
          <Button onClick={() => setWrap((value) => !value)}>
            Wrap: {wrap() ? 'enabled' : 'disabled'}
          </Button>

          <div class="max-w-md">
            <Breadcrumb
              wrap={wrap()}
              items={[
                { label: 'Very long section name that can wrap', href: '#' },
                { label: 'Another long nested section title', href: '#' },
                { label: 'Current page with long title', href: '#', active: true },
              ]}
            />
          </div>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
