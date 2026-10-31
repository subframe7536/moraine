import { Textarea } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function TextareaPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'input',
          prop: 'placeholder',
          label: 'Placeholder',
          defaultValue: 'Write a comment or description...',
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
        { kind: 'switch', prop: 'autoResize', label: 'Auto-resize', defaultValue: true },
      ]}
    >
      {(props) => (
        <Textarea
          placeholder={props.placeholder}
          variant={props.variant}
          size={props.size}
          disabled={props.disabled}
          autoResize={props.autoResize}
          rows={3}
          class="max-w-sm"
        />
      )}
    </DocsPlayground>
  )
}
