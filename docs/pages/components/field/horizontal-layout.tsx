import { Field, Input } from '@src'

export function HorizontalLayout() {
  return (
    <Field orientation="horizontal" label="Display name" description="Shown to other users.">
      <Input />
    </Field>
  )
}
