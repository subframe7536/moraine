import { For, createSignal } from 'solid-js'

import { Button, Form, FormField, Slider } from '../../../src'
import type { SliderT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

type SliderValue = SliderT.Value

function ControlledSingle() {
  function formatSliderValue(value: SliderValue): string {
    if (Array.isArray(value)) {
      return value.join(' - ')
    }

    return String(value)
  }

  const [singleValue, setSingleValue] = createSignal<SliderValue>(32)

  const [singleCommit, setSingleCommit] = createSignal<SliderValue>(32)

  type SliderValue = SliderT.Value

  return (
    <div class="max-w-xl space-y-3">
      <Slider
        value={singleValue()}
        min={0}
        max={100}
        step={1}
        onValueChange={setSingleValue}
        onChange={setSingleCommit}
      />
      <p class="text-xs text-muted-foreground">Current value: {formatSliderValue(singleValue())}</p>
      <p class="text-xs text-muted-foreground">
        Last committed value: {formatSliderValue(singleCommit())}
      </p>
    </div>
  )
}

function RangeSlider() {
  const [rangeValue, setRangeValue] = createSignal<number[]>([20, 75])

  return (
    <div class="max-w-xl space-y-3">
      <Slider
        value={rangeValue()}
        min={0}
        max={100}
        step={1}
        minStepsBetweenThumbs={10}
        onValueChange={(next) => {
          if (Array.isArray(next)) {
            setRangeValue(next)
          }
        }}
      />
      <p class="text-xs text-muted-foreground">
        Range: {rangeValue()[0]} - {rangeValue()[1]} ; Min steps between: 10
      </p>
    </div>
  )
}

function Orientation() {
  return (
    <div class="gap-8 grid items-start sm:grid-cols-2">
      <div class="space-y-2">
        <label class="text-xs text-muted-foreground block">Horizontal</label>
        <Slider defaultValue={45} />
      </div>
      <div class="space-y-2">
        <label class="text-xs text-muted-foreground block">Vertical</label>
        <div class="flex h-48 items-center">
          <Slider orientation="vertical" defaultValue={45} />
        </div>
      </div>
    </div>
  )
}

function Sizes() {
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="w-lg space-y-4">
      <For each={SIZES}>
        {(size) => (
          <div class="space-y-2">
            <label class="text-xs text-muted-foreground block uppercase">{size}</label>
            <Slider size={size} defaultValue={35} />
          </div>
        )}
      </For>
    </div>
  )
}

function FormIntegration() {
  const [formState, setFormState] = createSignal({
    volume: 10,
  })

  const updateFormVolume = (nextValue: SliderValue) => {
    const next = Array.isArray(nextValue) ? (nextValue[0] ?? 0) : nextValue
    setFormState((prev) => ({ ...prev, volume: next }))
  }

  return (
    <Form
      state={formState()}
      validateOn={['input']}
      validateOnInputDelay={0}
      validate={(state) => {
        if ((state?.volume ?? 0) < 20) {
          return [{ name: 'volume', message: 'Volume must be at least 20.' }]
        }

        return []
      }}
    >
      <div class="max-w-xl space-y-4">
        <FormField name="volume" label="Volume" description="Keep it at least 20.">
          <Slider value={formState().volume} onValueChange={updateFormVolume} />
        </FormField>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">Current volume: {formState().volume}</p>
        </div>
      </div>
    </Form>
  )
}

export default () => {
  return (
    <DemoPage componentKey="slider">
      <DemoSection
        title="Controlled Single"
        description="Input phase updates with onValueChange and commit phase updates with onChange."
        demo={ControlledSingle}
      />

      <DemoSection
        title="Range Slider"
        description="Two thumbs with min steps between thumbs and controlled array value."
        demo={RangeSlider}
      />

      <DemoSection
        title="Orientation"
        description="Horizontal default layout and vertical layout with fixed container height."
        demo={Orientation}
      />

      <DemoSection title="Sizes" description="Track and thumb sizing from xs to xl." demo={Sizes} />

      <DemoSection
        title="Form Integration"
        description="Submit to validate required minimum value through Form + FormField."
        demo={FormIntegration}
      />
    </DemoPage>
  )
}
