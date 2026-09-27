import { CheckboxGroup } from '@src'

const ROLE_OPTIONS = [
  { label: 'Read repository', value: 'read' },
  { label: 'Write changes', value: 'write' },
  { label: 'Admin access', value: 'admin', disabled: true },
]

export function FormBehavior() {
  return (
    <div class="max-w-md">
      <CheckboxGroup name="permissions" items={ROLE_OPTIONS} defaultValue={['read']} />
    </div>
  )
}
