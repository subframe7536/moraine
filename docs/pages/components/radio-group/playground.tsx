import { RadioGroup } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const PLAN_OPTIONS = [
  { label: 'Hobby', value: 'hobby', description: 'Free forever for personal projects' },
  { label: 'Pro', value: 'pro', description: '$20/month for growing teams' },
  { label: 'Enterprise', value: 'enterprise', description: 'Custom scale and security' },
]

export default function RadioGroupPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'card',
          options: [
            { label: 'Card', value: 'card' },
            { label: 'List', value: 'list' },
            { label: 'Table', value: 'table' },
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
          defaultValue: 'vertical',
          options: [
            { label: 'Vertical', value: 'vertical' },
            { label: 'Horizontal', value: 'horizontal' },
          ],
        },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="max-w-full w-96">
          <RadioGroup
            items={PLAN_OPTIONS}
            defaultValue="pro"
            variant={props.variant}
            size={props.size}
            disabled={props.disabled}
            orientation={props.orientation}
          />
        </div>
      )}
    </DocsPlayground>
  )
}
