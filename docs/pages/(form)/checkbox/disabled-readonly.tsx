import { Checkbox } from '@src'

export function DisabledReadonly() {
  return (
    <div class="flex flex-col gap-4">
      <Checkbox
        disabled
        defaultChecked
        label="Disabled (checked)"
        description="Non-interactive and removed from form submission."
      />
      <Checkbox
        readOnly
        defaultChecked
        label="Read-only (checked)"
        description="Focusable and submitted, but prevents value changes."
      />
    </div>
  )
}
