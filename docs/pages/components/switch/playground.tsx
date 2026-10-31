import { Switch } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function SwitchPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'input', prop: 'label', label: 'Label', defaultValue: 'Email alerts' },
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
        { kind: 'switch', prop: 'loading', label: 'Loading', defaultValue: false },
      ]}
    >
      {(props) => (
        <Switch
          label={props.label}
          description="Receive a notification when a deployment completes."
          size={props.size}
          checkedIcon="icon-check"
          uncheckedIcon="icon-close"
          defaultChecked
          disabled={props.disabled}
          loading={props.loading}
        />
      )}
    </DocsPlayground>
  )
}
