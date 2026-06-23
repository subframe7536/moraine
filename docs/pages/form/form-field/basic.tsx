import { FormField, Input } from '@src'

export function Basic() {
  return (
    <div class="mx-auto max-w-xl w-full">
      <FormField
        label="Workspace Name"
        hint="Required"
        description="Name used in URLs and workspace-level permissions."
        help="Use lowercase letters, numbers, and dashes."
        required
      >
        <Input placeholder="acme-platform" />
      </FormField>
    </div>
  )
}
