import { CheckboxGroup } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const NOTIFICATION_OPTIONS = [
  { label: 'Email alerts', value: 'email', description: 'Weekly digests and critical updates' },
  {
    label: 'Push notifications',
    value: 'push',
    description: 'Instant alerts on mobile and desktop',
  },
  { label: 'SMS updates', value: 'sms', description: 'Security and login codes' },
]

export default function CheckboxGroupPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'card',
          options: [
            { label: 'List', value: 'list' },
            { label: 'Card', value: 'card' },
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
          <CheckboxGroup
            legend="Notification channels"
            items={NOTIFICATION_OPTIONS}
            defaultValue={['email']}
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
