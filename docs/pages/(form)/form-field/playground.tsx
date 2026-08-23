import { FormField, Input } from '@src'
import type { FormFieldT } from '@src'

export interface FormFieldPlaygroundProps {
  label?: string
  description?: string
  hint?: string
  error?: string
  size?: FormFieldT.Variant['size']
  required?: boolean
}

export function FormFieldPlayground(props: FormFieldPlaygroundProps) {
  return (
    <div class="max-w-full w-80">
      <FormField
        label={props.label ?? 'Email address'}
        description={props.description ?? "We'll never share your email."}
        hint={props.hint ?? 'Required'}
        error={props.error ? props.error : undefined}
        size={props.size ?? 'md'}
        required={props.required ?? false}
      >
        <Input placeholder="you@example.com" leading="i-lucide:mail" />
      </FormField>
    </div>
  )
}
