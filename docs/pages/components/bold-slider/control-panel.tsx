import { BoldSlider } from '@src'
import { createSignal } from 'solid-js'

export function ControlPanel() {
  const [bounce, setBounce] = createSignal(0.5)
  const [stiffness, setStiffness] = createSignal(120)
  const [delay, setDelay] = createSignal(0)

  return (
    <div class="max-w-sm w-full space-y-2">
      <BoldSlider
        label="Bounce"
        value={bounce()}
        onValueChange={setBounce}
        min={0}
        max={1}
        step={0.1}
        marker
      />
      <BoldSlider
        label="Stiffness"
        value={stiffness()}
        onValueChange={setStiffness}
        min={0}
        max={300}
        step={10}
      />
      <BoldSlider
        label="Delay"
        value={delay()}
        onValueChange={setDelay}
        min={0}
        max={2000}
        step={50}
        formatValue={(ms) => `${ms}ms`}
      />
    </div>
  )
}
