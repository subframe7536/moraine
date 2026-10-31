import { Checkbox } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function CheckboxPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'input',
          prop: 'label',
          label: 'Label',
          defaultValue: 'Accept terms and conditions',
        },
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'list',
          options: [
            { label: 'List', value: 'list' },
            { label: 'Card', value: 'card' },
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
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <Checkbox
          label={props.label}
          description="I agree to the privacy policy and terms of service."
          variant={props.variant}
          size={props.size}
          disabled={props.disabled}
          defaultChecked
        />
      )}
    </DocsPlayground>
  )
}
