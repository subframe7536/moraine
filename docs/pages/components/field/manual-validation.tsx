import { Field, Input } from '@src'
import { createSignal } from 'solid-js'

export function ManualValidation() {
  const [error, setError] = createSignal<string | false>()
  return (
    <Field label="Username" error={error()}>
      <Input onValueChange={(value) => setError(value ? false : 'Username is required')} />
    </Field>
  )
}
