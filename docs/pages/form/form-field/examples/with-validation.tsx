import { Button, Form, FormField, Input } from '@src'
import { createSignal } from 'solid-js'

export function WithValidation() {
  const [state, setState] = createSignal({
    email: '',
  })

  return (
    <Form
      state={state()}
      validate={(value) => {
        const errors: { name: string; message: string }[] = []

        if (!value?.email?.trim()) {
          errors.push({ name: 'email', message: 'Email is required.' })
        } else if (!value.email.includes('@')) {
          errors.push({ name: 'email', message: 'Enter a valid email.' })
        }

        return errors
      }}
      classes={{ root: 'mx-auto max-w-xl w-full space-y-4' }}
    >
      <FormField name="email" label="Owner Email" required>
        <Input
          type="email"
          value={state().email}
          onValueChange={(value) => setState((prev) => ({ ...prev, email: String(value) }))}
          placeholder="owner@acme.dev"
        />
      </FormField>

      <Button type="submit">Save</Button>
    </Form>
  )
}
