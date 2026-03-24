import { For, createSignal } from 'solid-js'

import { Checkbox } from '../../../src'
import type { CheckboxT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function VariantsIndicator() {
  return (
    <div class="gap-4 grid sm:grid-cols-2">
      <div class="space-y-3">
        <Checkbox label="List / start" description="Default list style" defaultChecked />
        <Checkbox
          label="List / end"
          description="Indicator at the end"
          indicator="end"
          defaultChecked
        />
        <Checkbox
          label="List / hidden"
          description="Only text, no visible indicator"
          indicator="hidden"
          defaultChecked
        />
      </div>

      <div class="space-y-3">
        <Checkbox
          variant="card"
          label="Card variant"
          description="Whole card area is clickable"
          defaultChecked
        />
        <Checkbox
          variant="card"
          label="Card / end"
          description="Card with trailing indicator"
          indicator="end"
        />
        <Checkbox variant="card" label="Card / disabled" description="Disabled state" disabled />
      </div>
    </div>
  )
}

function Sizes() {
  const SIZES: CheckboxSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type CheckboxSizeName = Exclude<CheckboxT.Variant['size'], undefined>

  return (
    <div class="flex flex-col gap-2 max-w-xl">
      <For each={SIZES}>
        {(size) => (
          <Checkbox
            size={size}
            label={`Size ${size}`}
            description={`Checkbox size: ${size}`}
            defaultChecked={size === 'md' || size === 'xl'}
          />
        )}
      </For>
    </div>
  )
}

function IndeterminateCustomIcons() {
  const [indeterminate, setIndeterminate] = createSignal<'indeterminate' | boolean>('indeterminate')

  return (
    <div class="max-w-xl space-y-3">
      <Checkbox
        label="Permissions"
        description={`Current: ${String(indeterminate())}`}
        checked={indeterminate()}
        onChange={setIndeterminate}
        checkedIcon="i-lucide:check-check"
        indeterminateIcon="i-lucide:ellipsis"
      />
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="text-sm px-3 py-1.5 b-(1 border) rounded-md hover:bg-muted"
          onClick={() => setIndeterminate('indeterminate')}
        >
          Set indeterminate
        </button>
        <button
          type="button"
          class="text-sm px-3 py-1.5 b-(1 border) rounded-md hover:bg-muted"
          onClick={() => setIndeterminate(true)}
        >
          Set checked
        </button>
        <button
          type="button"
          class="text-sm px-3 py-1.5 b-(1 border) rounded-md hover:bg-muted"
          onClick={() => setIndeterminate(false)}
        >
          Set unchecked
        </button>
      </div>
    </div>
  )
}

function CustomTrueFalseValues() {
  const INDICATORS: CheckboxIndicatorName[] = ['start', 'end', 'hidden']

  const [featureFlag, setFeatureFlag] = createSignal<'enabled' | 'disabled'>('enabled')

  type CheckboxIndicatorName = Exclude<CheckboxT.Variant['indicator'], undefined>

  return (
    <div class="max-w-xl space-y-3">
      <Checkbox<'enabled', 'disabled'>
        label="Feature flag"
        description="Controlled with custom values"
        trueValue="enabled"
        falseValue="disabled"
        checked={featureFlag()}
        onChange={setFeatureFlag}
        indicator="end"
      />
      <p class="text-xs text-muted-foreground">Current value: {featureFlag()}</p>

      <div class="p-3 b-(1 border) rounded-lg">
        <p class="text-xs text-muted-foreground mb-2">Indicator matrix:</p>
        <div class="flex flex-col gap-2">
          <For each={INDICATORS}>
            {(indicator) => (
              <Checkbox
                indicator={indicator}
                label={`Indicator ${indicator}`}
                description="Uncontrolled"
                defaultChecked
              />
            )}
          </For>
        </div>
      </div>
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="checkbox">
      <DemoSection
        title="Variants + Indicator"
        description="List and card variants with start/end/hidden indicator positions."
        demo={VariantsIndicator}
      />

      <DemoSection
        title="Sizes"
        description="Scale from xs to xl with unified label spacing."
        demo={Sizes}
      />

      <DemoSection
        title="Indeterminate + Custom Icons"
        description="Custom checked/indeterminate icons with controlled indeterminate transition."
        demo={IndeterminateCustomIcons}
      />

      <DemoSection
        title="Custom true/false values"
        description="Map checked state to domain values instead of boolean."
        demo={CustomTrueFalseValues}
      />
    </DemoPage>
  )
}
