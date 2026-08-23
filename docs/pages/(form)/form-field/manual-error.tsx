import { FormField, Input } from '@src'

export function ManualError() {
  return (
    <div class="mx-auto max-w-xl w-full">
      <FormField
        label="Access Token"
        hint="Required"
        error="Token has expired. Generate a new token and retry."
      >
        <Input type="password" value="********" />
      </FormField>
    </div>
  )
}
