import { Input } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function InputPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'input',
          prop: 'placeholder',
          label: 'Placeholder',
          defaultValue: 'Search repositories...',
        },
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
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <Input
          placeholder={props.placeholder}
          variant={props.variant}
          size={props.size}
          disabled={props.disabled}
          class="max-w-sm"
        />
      )}
    </DocsPlayground>
  )
}
