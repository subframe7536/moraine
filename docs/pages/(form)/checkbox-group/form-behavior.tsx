import { CheckboxGroup, FormField } from '@src'

const ROLE_OPTIONS = [
  { label: 'Read repository', value: 'read' },
  { label: 'Write changes', value: 'write' },
  { label: 'Admin access', value: 'admin', disabled: true },
]

export function FormBehavior() {
  return (
    <div class="max-w-md">
      <FormField
        label="Role permissions"
        description="Assigned permissions for the selected team members."
        required
      >
        <CheckboxGroup name="permissions" items={ROLE_OPTIONS} defaultValue={['read']} />
      </FormField>
    </div>
  )
}
