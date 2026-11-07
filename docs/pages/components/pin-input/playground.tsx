import { PinInput } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function PinInputPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'type',
          label: 'Type',
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Number', value: 'number' },
            { label: 'Alphanumeric', value: 'alphanumeric' },
          ],
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
        { kind: 'switch', prop: 'separator', label: 'Separator', defaultValue: true },
        { kind: 'switch', prop: 'otp', label: 'OTP', defaultValue: true },
        { kind: 'switch', prop: 'mask', label: 'Mask', defaultValue: false },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <PinInput
          type={props.type}
          variant={props.variant}
          size={props.size}
          separator={props.separator}
          otp={props.otp}
          mask={props.mask}
          disabled={props.disabled}
          length={6}
        />
      )}
    </DocsPlayground>
  )
}
