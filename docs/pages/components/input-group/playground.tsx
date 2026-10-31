import { Icon, Input, InputGroup } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function InputGroupPlayground() {
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
        { kind: 'switch', prop: 'invalid', label: 'Invalid', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="max-w-md w-full">
          <InputGroup size={props.size} orientation={props.orientation} aria-label="Account name">
            <InputGroup.Leading>
              <Icon name="i-lucide:at-sign" />
            </InputGroup.Leading>
            <Input
              id="account-name"
              aria-label="Account name"
              placeholder="your-name"
              disabled={props.disabled}
              aria-invalid={props.invalid}
            />
            <InputGroup.Trailing>@example.com</InputGroup.Trailing>
          </InputGroup>
        </div>
      )}
    </DocsPlayground>
  )
}
