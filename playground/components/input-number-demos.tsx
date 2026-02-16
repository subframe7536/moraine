import { For, createSignal } from 'solid-js'

import { InputNumber } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const VARIANTS = ['outline', 'soft', 'subtle', 'ghost'] as const

export const InputNumberDemos = () => {
  const [controlledValue, setControlledValue] = createSignal(10)

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Input Number"
      description="Numeric stepper with horizontal/vertical orientations, variants, and controlled state."
    >
      <DemoSection
        title="Orientations"
        description="Horizontal (default) and vertical button layouts."
      >
        <div class="flex flex-wrap gap-6 items-start">
          <div class="space-y-1">
            <label class="text-xs text-zinc-500 block">Horizontal</label>
            <InputNumber defaultValue={5} minValue={0} maxValue={20} />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-zinc-500 block">Vertical</label>
            <InputNumber orientation="vertical" defaultValue={5} minValue={0} maxValue={20} />
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Variants" description="Visual style variants for the input shell.">
        <div class="flex flex-wrap gap-6 items-start">
          <For each={VARIANTS}>
            {(variant) => (
              <div class="space-y-1">
                <label class="text-xs text-zinc-500 block">{variant}</label>
                <InputNumber variant={variant} defaultValue={3} />
              </div>
            )}
          </For>
        </div>
      </DemoSection>

      <DemoSection title="Controlled" description="Value bound to a signal with live readout.">
        <div class="max-w-xs space-y-2">
          <InputNumber
            value={controlledValue()}
            onRawValueChange={(v) => {
              if (Number.isFinite(v)) {
                setControlledValue(v)
              }
            }}
            minValue={0}
            maxValue={99}
            variant="subtle"
            highlight
          />
          <p class="text-xs text-zinc-600">Current value: {controlledValue()}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="Min / Max / Step"
        description="Constrained ranges and custom step increments."
      >
        <div class="flex flex-wrap gap-6 items-start">
          <div class="space-y-1">
            <label class="text-xs text-zinc-500 block">Step 5 (0–100)</label>
            <InputNumber defaultValue={25} minValue={0} maxValue={100} step={5} />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-zinc-500 block">Step 0.1 (0–1)</label>
            <InputNumber defaultValue={0.5} minValue={0} maxValue={1} step={0.1} />
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Disabled" description="Non-interactive disabled state.">
        <InputNumber defaultValue={7} disabled />
      </DemoSection>
    </DemoPage>
  )
}
