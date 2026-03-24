import { For, createSignal } from 'solid-js'

import { InputNumber } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Orientations() {
  return (
    <div class="flex flex-wrap gap-6 items-start">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">Horizontal</label>
        <InputNumber defaultValue={5} minValue={0} maxValue={20} />
      </div>
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">Vertical</label>
        <InputNumber orientation="vertical" defaultValue={5} minValue={0} maxValue={20} />
      </div>
    </div>
  )
}

function Variants() {
  const VARIANTS = ['outline', 'subtle', 'ghost', 'none'] as const

  return (
    <div class="flex flex-wrap gap-6 items-start">
      <For each={VARIANTS}>
        {(variant) => (
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground block">{variant}</label>
            <InputNumber variant={variant} defaultValue={3} />
          </div>
        )}
      </For>
    </div>
  )
}

function Controlled() {
  const [controlledValue, setControlledValue] = createSignal(10)

  return (
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
      <p class="text-xs text-muted-foreground">Current value: {controlledValue()}</p>
    </div>
  )
}

function LongPress() {
  const [pressHoldValue, setPressHoldValue] = createSignal(12)

  return (
    <div class="max-w-xs space-y-2">
      <InputNumber
        value={pressHoldValue()}
        onRawValueChange={(v) => {
          if (Number.isFinite(v)) {
            setPressHoldValue(v)
          }
        }}
        minValue={0}
        maxValue={99}
        step={1}
        variant="subtle"
      />
      <p class="text-xs text-muted-foreground">
        Hold <span class="font-medium">+</span> or <span class="font-medium">−</span> to repeat.
        Current value: {pressHoldValue()}
      </p>
    </div>
  )
}

function MinMaxStep() {
  return (
    <div class="flex flex-wrap gap-6 items-start">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">Step 5 (0–100)</label>
        <InputNumber defaultValue={25} minValue={0} maxValue={100} step={5} />
      </div>
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">Step 0.1 (0–1)</label>
        <InputNumber defaultValue={0.5} minValue={0} maxValue={1} step={0.1} />
      </div>
    </div>
  )
}

function Disabled() {
  return <InputNumber defaultValue={7} disabled />
}

export default () => {
  return (
    <DemoPage componentKey="input-number">
      <DemoSection
        title="Orientations"
        description="Horizontal (default) and vertical button layouts."
        demo={Orientations}
      />

      <DemoSection
        title="Variants"
        description="Visual style variants for the input shell."
        demo={Variants}
      />

      <DemoSection
        title="Controlled"
        description="Value bound to a signal with live readout."
        demo={Controlled}
      />

      <DemoSection
        title="Long press"
        description="Press and hold increment or decrement to continuously step the value."
        demo={LongPress}
      />

      <DemoSection
        title="Min / Max / Step"
        description="Constrained ranges and custom step increments."
        demo={MinMaxStep}
      />

      <DemoSection title="Disabled" description="Non-interactive disabled state." demo={Disabled} />
    </DemoPage>
  )
}
