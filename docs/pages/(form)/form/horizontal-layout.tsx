import { createForm, Input, Select } from '@src'
import * as v from 'valibot'

export function HorizontalLayout() {
  const form = createForm({
    schema: v.object({
      displayName: v.string(),
      role: v.string(),
    }),
    initialInput: { displayName: '', role: '' },
  })

  return (
    <div class="mx-auto max-w-2xl w-full space-y-4">
      <form.Field
        name="displayName"
        orientation="horizontal"
        label="Display Name"
        description="Public name shown in activity feeds."
      >
        <Input placeholder="Moraine Team" />
      </form.Field>

      <form.Field name="role" orientation="horizontal" label="Default Role" required>
        <Select
          options={[
            { label: 'Developer', value: 'developer' },
            { label: 'Designer', value: 'designer' },
            { label: 'Manager', value: 'manager' },
          ]}
          placeholder="Select role"
        />
      </form.Field>
    </div>
  )
}
