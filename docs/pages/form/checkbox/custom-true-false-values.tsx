import { Checkbox } from '@src'
import type { CheckboxT } from '@src'
import { For, createSignal } from 'solid-js'

export function CustomTrueFalseValues() {
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
