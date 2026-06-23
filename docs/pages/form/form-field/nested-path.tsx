import { Button, Form, FormField, Input } from '@src'
import { createSignal } from 'solid-js'

export function NestedPath() {
  const [state, setState] = createSignal({
    profile: {
      name: '',
      email: '',
    },
  })

  return (
    <Form
      state={state()}
      validate={(value) => {
        const errors: { name: string[]; message: string }[] = []

        if (!value?.profile?.name?.trim()) {
          errors.push({ name: ['profile', 'name'], message: 'Name is required.' })
        }
        if (!value?.profile?.email?.includes('@')) {
          errors.push({ name: ['profile', 'email'], message: 'Valid email is required.' })
        }

        return errors
      }}
      classes={{ root: 'mx-auto max-w-xl w-full space-y-4' }}
    >
      <FormField name={['profile', 'name']} label="Profile Name" required>
        <Input
          value={state().profile.name}
          onValueChange={(value) =>
            setState((prev) => ({
              ...prev,
              profile: { ...prev.profile, name: String(value) },
            }))
          }
          placeholder="Moraine Team"
        />
      </FormField>

      <FormField name={['profile', 'email']} label="Profile Email" required>
        <Input
          type="email"
          value={state().profile.email}
          onValueChange={(value) =>
            setState((prev) => ({
              ...prev,
              profile: { ...prev.profile, email: String(value) },
            }))
          }
          placeholder="team@acme.dev"
        />
      </FormField>

      <Button type="submit">Save Profile</Button>
    </Form>
  )
}
