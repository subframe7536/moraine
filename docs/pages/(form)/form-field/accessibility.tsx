import { FormField, Input } from '@src'

export function Accessibility() {
  return (
    <div class="max-w-md w-full">
      <FormField
        label="Account username"
        description="Used for public profile URL."
        error="This username is already taken."
        required
      >
        <Input value="existing_user" />
      </FormField>
    </div>
  )
}
