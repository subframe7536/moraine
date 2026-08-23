import { Checkbox } from '@src'
import type { CheckboxT } from '@src'

export interface CheckboxPlaygroundProps {
  label?: string
  description?: string
  variant?: CheckboxT.Variant['variant']
  size?: CheckboxT.Variant['size']
  disabled?: boolean
}

export function CheckboxPlayground(props: CheckboxPlaygroundProps) {
  return (
    <div class="max-w-full w-80">
      <Checkbox
        label={props.label ?? 'Accept terms and conditions'}
        description={props.description ?? 'You agree to the user agreement and privacy policy.'}
        variant={props.variant ?? 'list'}
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        defaultChecked
      />
    </div>
  )
}
