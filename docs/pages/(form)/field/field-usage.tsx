import { Field, Input } from '@src'

export function FieldUsage() {
  return (
    <Field label="Email" description="We'll only use this for account notifications.">
      <Input name="email" placeholder="you@example.com" />
    </Field>
  )
}
