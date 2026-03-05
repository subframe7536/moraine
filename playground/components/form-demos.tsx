import { createSignal } from 'solid-js'

import { Button, Checkbox, CheckboxGroup, RadioGroup, Switch } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const CHECKBOX_GROUP_ITEMS = [
  {
    value: 'alpha',
    label: 'Alpha',
    description: 'Primary rollout channel',
  },
  {
    value: 'beta',
    label: 'Beta',
    description: 'Early access channel',
  },
  {
    value: 'stable',
    label: 'Stable',
    description: 'Production channel',
  },
]

const RADIO_ITEMS = [
  {
    value: 'starter',
    label: 'Starter',
    description: 'For personal projects',
  },
  {
    value: 'pro',
    label: 'Pro',
    description: 'For teams and scaling',
  },
  {
    value: 'ultra',
    label: 'Ultra',
    description: 'For power user',
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'For regulated workloads',
  },
]

export const FormDemos = () => {
  const [agreeChecked, setAgreeChecked] = createSignal(true)

  const [groupValue, setGroupValue] = createSignal<string[]>(['beta'])

  const [planValue, setPlanValue] = createSignal('pro')

  const [switchValue, setSwitchValue] = createSignal(false)
  const [switchLoading, setSwitchLoading] = createSignal(false)

  const runSwitchLoading = async () => {
    setSwitchLoading(true)
    await wait(900)
    setSwitchLoading(false)
  }

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Form Controls"
      description="Interactive previews for checkbox, checkbox-group, radio-group, and switch."
    >
      <DemoSection
        title="Checkbox"
        description="Single checkbox states with full-surface card interactions and controlled value."
      >
        <div class="gap-4 grid sm:grid-cols-2">
          <div class="p-4 border border-zinc-200 rounded-lg space-y-3">
            <Checkbox
              label="Default list style"
              description="No variant prop, focus ring follows keyboard focus"
              defaultChecked
            />
            <Checkbox
              label="Default list style"
              description="No variant prop, focus ring follows keyboard focus"
              defaultChecked
            />
            <Checkbox
              label="Default list style"
              description="No variant prop, focus ring follows keyboard focus"
              defaultChecked
            />
          </div>

          <div class="p-4 border border-zinc-200 rounded-lg space-y-3">
            <Checkbox
              label="Accept terms"
              description="Required before creating workspace"
              variant="card"
              defaultChecked
            />
            <Checkbox
              label="Disabled option"
              description="Read only preview"
              variant="card"
              disabled
            />
          </div>

          <div class="p-4 border border-zinc-200 rounded-lg space-y-3">
            <Checkbox
              label="Controlled consent"
              description={`Current: ${agreeChecked() ? 'checked' : 'unchecked'}`}
              variant="list"
              indicator="end"
              checked={agreeChecked()}
              onChange={setAgreeChecked}
            />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Checkbox Group"
        description="Supports object items with card/table variants and controlled arrays."
      >
        <div class="gap-4 grid sm:grid-cols-2">
          <div class="p-4 border border-zinc-200 rounded-lg space-y-3">
            <CheckboxGroup
              legend="Uncontrolled channels"
              items={CHECKBOX_GROUP_ITEMS}
              variant="card"
              defaultValue={['alpha']}
            />
          </div>

          <div class="p-4 border border-zinc-200 rounded-lg space-y-3">
            <CheckboxGroup
              legend="Controlled channels"
              items={CHECKBOX_GROUP_ITEMS}
              orientation="horizontal"
              variant="table"
              value={groupValue()}
              onChange={setGroupValue}
            />
            <p class="text-xs text-zinc-600">Selected: {groupValue().join(', ') || 'none'}</p>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Radio Group"
        description="Single-selection options with card/table layouts and controlled value."
      >
        <div class="mb-4 p-4 border border-zinc-200 rounded-lg">
          <RadioGroup legend="Default list plan" items={RADIO_ITEMS} defaultValue="pro" />
        </div>

        <div class="gap-4 grid sm:grid-cols-2">
          <div class="p-4 border border-zinc-200 rounded-lg space-y-3">
            <RadioGroup
              legend="Uncontrolled plan"
              items={RADIO_ITEMS}
              variant="card"
              defaultValue="starter"
            />
          </div>

          <div class="p-4 border border-zinc-200 rounded-lg space-y-3">
            <RadioGroup
              legend="Controlled plan"
              items={RADIO_ITEMS}
              orientation="horizontal"
              variant="table"
              value={planValue()}
              onChange={setPlanValue}
            />
            <p class="text-xs text-zinc-600">Current plan: {planValue()}</p>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Switch"
        description="Toggle states with icon slots and loading lock behavior."
      >
        <div class="gap-4 grid sm:grid-cols-2">
          <div class="p-4 border border-zinc-200 rounded-lg space-y-3">
            <Switch
              label="Email alerts"
              description="Uncontrolled state"
              checkedIcon="i-lucide-bell"
              uncheckedIcon="i-lucide-bell-off"
            />
          </div>

          <div class="p-4 border border-zinc-200 rounded-lg space-y-3">
            <Switch
              label="Deploy protection"
              description={`Current: ${switchValue() ? 'enabled' : 'disabled'}`}
              checked={switchValue()}
              onChange={setSwitchValue}
              loading={switchLoading()}
              checkedIcon="i-lucide-shield-check"
              uncheckedIcon="i-lucide-shield"
            />
            <Button size="sm" variant="outline" onclick={runSwitchLoading}>
              Simulate loading
            </Button>
          </div>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
