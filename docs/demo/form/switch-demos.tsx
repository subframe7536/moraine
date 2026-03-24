import { For, createSignal } from 'solid-js'

import { Switch } from '../../../src'
import type { SwitchT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function BasicControlled() {
  const [checked, setChecked] = createSignal(false)

  return (
    <div class="flex flex-col gap-3 max-w-xl">
      <Switch
        label="Email alerts"
        description="Uncontrolled"
        defaultChecked
        checkedIcon="i-lucide-bell"
        uncheckedIcon="i-lucide-bell-off"
      />
      <Switch
        label="Deploy protection"
        description={`Current: ${checked() ? 'enabled' : 'disabled'}`}
        checked={checked()}
        onChange={setChecked}
        checkedIcon="i-lucide-shield-check"
        uncheckedIcon="i-lucide-shield"
      />
    </div>
  )
}

function Sizes() {
  const SIZES: SwitchSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type SwitchSizeName = Exclude<SwitchT.Variant['size'], undefined>

  return (
    <div class="gap-3 grid sm:grid-cols-2">
      <For each={SIZES}>
        {(size) => (
          <Switch
            size={size}
            label={`Size ${size}`}
            description="Size preview"
            defaultChecked={size === 'lg' || size === 'xl'}
          />
        )}
      </For>
    </div>
  )
}

function IconAndStateVariants() {
  return (
    <div class="flex flex-col gap-3 max-w-xl">
      <Switch
        label="Sync in progress"
        description="Loading state"
        loading
        checked
        checkedIcon="i-lucide-check"
        uncheckedIcon="i-lucide-x"
      />
      <Switch
        label="Dark mode"
        description="Custom icons"
        defaultChecked
        checkedIcon="i-lucide-moon-star"
        uncheckedIcon="i-lucide-sun"
      />
      <Switch
        label="Billing lock"
        description="Disabled"
        disabled
        checked
        checkedIcon="i-lucide-lock"
        uncheckedIcon="i-lucide-unlock"
      />
    </div>
  )
}

function CustomTrueFalseValues() {
  const [deploymentGuard, setDeploymentGuard] = createSignal<'enabled' | 'disabled'>('disabled')

  return (
    <div class="max-w-xl space-y-3">
      <Switch<'enabled', 'disabled'>
        label="Deployment gate"
        description="Domain value binding"
        trueValue="enabled"
        falseValue="disabled"
        checked={deploymentGuard()}
        onChange={setDeploymentGuard}
        checkedIcon="i-lucide-check-check"
        uncheckedIcon="i-lucide-x"
      />
      <p class="text-xs text-muted-foreground">Current value: {deploymentGuard()}</p>
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="switch">
      <DemoSection
        title="Basic + Controlled"
        description="Uncontrolled and controlled switch with icon slots."
        demo={BasicControlled}
      />

      <DemoSection title="Sizes" description="Switch size scale from xs to xl." demo={Sizes} />

      <DemoSection
        title="Icon and State Variants"
        description="Loading, disabled, and explicit icon combinations."
        demo={IconAndStateVariants}
      />

      <DemoSection
        title="Custom true/false values"
        description="Map checked state to domain values instead of boolean."
        demo={CustomTrueFalseValues}
      />
    </DemoPage>
  )
}
