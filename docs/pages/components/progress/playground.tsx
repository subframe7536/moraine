import { Progress } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function ProgressPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'input', prop: 'label', label: 'Label', defaultValue: 'Uploading design.fig' },
        {
          kind: 'input',
          prop: 'value',
          label: 'Progress (%)',
          defaultValue: 65,
          inputType: 'number',
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
        { kind: 'switch', prop: 'showValue', label: 'Value', defaultValue: true },
      ]}
    >
      {(props) => (
        <Progress
          label={props.label}
          value={props.value}
          size={props.size}
          showValue={props.showValue}
          aria-label="Upload progress"
        />
      )}
    </DocsPlayground>
  )
}
