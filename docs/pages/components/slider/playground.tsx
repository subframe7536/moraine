import { Slider } from '@src'
import { createSignal } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function SliderPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        { kind: 'switch', prop: 'step', label: 'Step', defaultValue: true },
        { kind: 'switch', prop: 'marker', label: 'Marker', defaultValue: true },
        { kind: 'switch', prop: 'vertical', label: 'Vertical', defaultValue: false },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'inverted', label: 'Inverted', defaultValue: false },
      ]}
    >
      {(props) => {
        const [value, setValue] = createSignal(60)
        return (
          <div
            class={
              props.vertical ? 'flex flex-col items-center gap-3 h-56' : 'space-y-3 w-full max-w-sm'
            }
          >
            <div
              class={`text-xs text-muted-foreground flex items-center justify-between ${
                props.vertical ? 'flex-col gap-1' : 'w-full'
              }`}
            >
              <span>Volume</span>
              <span class="text-foreground font-medium font-mono">{value().toFixed(0)}%</span>
            </div>
            <Slider
              defaultValue={60}
              onValueChange={(val) => {
                if (typeof val === 'number') {
                  setValue(val)
                }
              }}
              orientation={props.vertical ? 'vertical' : 'horizontal'}
              size={props.size}
              step={props.step ? 10 : undefined}
              marker={props.marker ? 10 : false}
              disabled={props.disabled}
              inverted={props.inverted}
            />
          </div>
        )
      }}
    </DocsPlayground>
  )
}
