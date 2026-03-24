import { createSignal } from 'solid-js'

import { Breadcrumb, Button } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Default() {
  const DEFAULT_ITEMS = [
    { label: 'Home', href: '#', icon: 'i-lucide:house' },
    { label: 'Library', href: '#', icon: 'i-lucide:folder' },
    { label: 'Components', href: '#', icon: 'i-lucide:box' },
    { label: 'Breadcrumb', href: '#', icon: 'i-lucide:bell-ring', active: true },
  ]

  return <Breadcrumb items={DEFAULT_ITEMS} />
}

function CustomSeparatorDisabled() {
  return (
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
  )
}

function Size() {
  return (
    <>
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
    </>
  )
}

function Wrapping() {
  const [wrap, setWrap] = createSignal(true)

  return (
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
  )
}

export default () => {
  return (
    <DemoPage componentKey="breadcrumb">
      <DemoSection
        title="Default"
        description="Simple breadcrumb trail with active last item."
        demo={Default}
      />

      <DemoSection
        title="Custom Separator + Disabled"
        description="Use an alternative separator and mark links as disabled."
        demo={CustomSeparatorDisabled}
      />
      <DemoSection title="Size" description="Different size." demo={Size} />

      <DemoSection
        title="Wrapping"
        description="Toggle wrapping behavior for long breadcrumb labels."
        demo={Wrapping}
      />
    </DemoPage>
  )
}
