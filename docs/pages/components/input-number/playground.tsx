import { InputNumber } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function InputNumberPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'outline',
          options: [
            { label: 'Outline', value: 'outline' },
            { label: 'Subtle', value: 'subtle' },
            { label: 'Ghost', value: 'ghost' },
            { label: 'None', value: 'none' },
          ],
        },
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
          prop: 'orientation',
          label: 'Orientation',
          defaultValue: 'horizontal',
          options: [
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Vertical', value: 'vertical' },
          ],
        },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'increment', label: 'Increment control', defaultValue: true },
      ]}
    >
      {(props) => (
        <div class="max-w-full w-64">
          <InputNumber
            variant={props.variant}
            size={props.size}
            orientation={props.orientation}
            disabled={props.disabled}
            increment={props.increment}
            defaultValue={24}
            minValue={0}
            maxValue={100}
          />
        </div>
      )}
    </DocsPlayground>
  )
}
