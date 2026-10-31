import { BoldSlider } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function BoldSliderPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'input', prop: 'label', label: 'Label', defaultValue: 'Bounce' },
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
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'subtle',
          options: [
            { label: 'Subtle', value: 'subtle' },
            { label: 'Solid', value: 'solid' },
          ],
        },
        { kind: 'switch', prop: 'step', label: 'Step', defaultValue: true },
        { kind: 'switch', prop: 'showValue', label: 'Show value', defaultValue: true },
        { kind: 'switch', prop: 'marker', label: 'Marker', defaultValue: true },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'inverted', label: 'Inverted', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="max-w-sm w-full">
          <BoldSlider
            defaultValue={0.5}
            min={0}
            max={1}
            label={props.label}
            size={props.size}
            variant={props.variant}
            step={props.step ? 0.1 : undefined}
            showValue={props.showValue}
            marker={props.marker ? 0.1 : false}
            disabled={props.disabled}
            inverted={props.inverted}
          />
        </div>
      )}
    </DocsPlayground>
  )
}
