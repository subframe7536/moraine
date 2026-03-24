import { For, createSignal } from 'solid-js'

import { RadioGroup } from '../../../src'
import type { RadioGroupT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function VariantMatrix() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  return (
    <div class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
      <div class="p-4 b-(1 border) rounded-lg">
        <RadioGroup legend="List" items={ITEMS} defaultValue="starter" />
      </div>
      <div class="p-4 b-(1 border) rounded-lg">
        <RadioGroup legend="Card" items={ITEMS} variant="card" defaultValue="pro" />
      </div>
      <div class="p-4 b-(1 border) rounded-lg">
        <RadioGroup
          legend="Table"
          items={ITEMS}
          variant="table"
          orientation="vertical"
          defaultValue="enterprise"
        />
      </div>
    </div>
  )
}

function IndicatorPositions() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  const INDICATORS: RadioGroupIndicatorName[] = ['start', 'end', 'hidden']

  type RadioGroupIndicatorName = Exclude<RadioGroupT.Variant['indicator'], undefined>

  return (
    <div class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
      <For each={INDICATORS}>
        {(indicator) => (
          <div class="p-4 b-(1 border) rounded-lg">
            <RadioGroup
              legend={`Indicator ${indicator}`}
              items={ITEMS}
              variant="card"
              indicator={indicator}
              defaultValue="pro"
            />
          </div>
        )}
      </For>
    </div>
  )
}

function SizesOrientation() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  const SIZES: RadioGroupSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type RadioGroupSizeName = Exclude<RadioGroupT.Variant['size'], undefined>

  return (
    <div class="gap-4 grid lg:grid-cols-2">
      <div class="space-y-3">
        <For each={SIZES}>
          {(size) => (
            <div class="p-4 b-(1 border) rounded-lg">
              <RadioGroup
                legend={`Size ${size}`}
                items={ITEMS}
                size={size}
                defaultValue="starter"
              />
            </div>
          )}
        </For>
      </div>
      <div class="space-y-3">
        <div class="p-4 b-(1 border) rounded-lg">
          <RadioGroup
            legend="Horizontal card"
            items={ITEMS}
            variant="card"
            orientation="horizontal"
            defaultValue="pro"
          />
        </div>
        <div class="p-4 b-(1 border) rounded-lg">
          <RadioGroup
            legend="Horizontal table"
            items={ITEMS}
            variant="table"
            orientation="horizontal"
            defaultValue="enterprise"
          />
        </div>
      </div>
    </div>
  )
}

function ControlledDisabled() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  const [value, setValue] = createSignal('pro')

  return (
    <div class="max-w-xl space-y-3">
      <RadioGroup
        legend="Plan selector"
        items={[
          ...ITEMS,
          {
            value: 'legacy',
            label: 'Legacy',
            description: 'No longer available',
            disabled: true,
          },
        ]}
        value={value()}
        onChange={setValue}
        variant="table"
        orientation="horizontal"
      />
      <p class="text-xs text-muted-foreground">Current plan: {value()}</p>
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="radio-group">
      <DemoSection
        title="Variant Matrix"
        description="List, card, and table variants for single selection."
        demo={VariantMatrix}
      />

      <DemoSection
        title="Indicator Positions"
        description="Start/end/hidden indicator styles with card variant."
        demo={IndicatorPositions}
      />

      <DemoSection
        title="Sizes + Orientation"
        description="Size scale and vertical/horizontal modes."
        demo={SizesOrientation}
      />

      <DemoSection
        title="Controlled + Disabled"
        description="Controlled value with disabled option in data set."
        demo={ControlledDisabled}
      />
    </DemoPage>
  )
}
