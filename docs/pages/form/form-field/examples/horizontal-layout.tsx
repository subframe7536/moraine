import { FormField, Input, Select } from '@src'

export function HorizontalLayout() {
  return (
    <div class="mx-auto max-w-2xl w-full space-y-4">
      <FormField
        orientation="horizontal"
        label="Display Name"
        description="Public name shown in activity feeds."
      >
        <Input placeholder="Moraine Team" />
      </FormField>

      <FormField orientation="horizontal" label="Default Role" required>
        <Select
          options={[
            { label: 'Developer', value: 'developer' },
            { label: 'Designer', value: 'designer' },
            { label: 'Manager', value: 'manager' },
          ]}
          placeholder="Select role"
        />
      </FormField>
    </div>
  )
}
