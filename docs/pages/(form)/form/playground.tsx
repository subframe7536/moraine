import { Button, createForm, Form, FormField, Input, Switch } from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email('Enter a valid email address.')),
  password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters.')),
  remember: v.boolean(),
})

export interface FormPlaygroundProps {
  disabled?: boolean
}

export function FormPlayground(props: FormPlaygroundProps) {
  const [success, setSuccess] = createSignal(false)
  const form = createForm({
    schema: LoginSchema,
    initialInput: {
      email: '',
      password: '',
      remember: true,
    },
  })

  return (
    <div class="max-w-full w-80">
      <Form of={form} onSubmit={() => setSuccess(true)} class="space-y-4">
        <FormField<typeof LoginSchema> name="email" label="Email" required>
          <Input placeholder="alex@example.com" disabled={props.disabled} leading="i-lucide:mail" />
        </FormField>

        <FormField<typeof LoginSchema> name="password" label="Password" required>
          <Input
            type="password"
            placeholder="••••••••"
            disabled={props.disabled}
            leading="i-lucide:lock"
          />
        </FormField>

        <FormField<typeof LoginSchema> name="remember">
          <Switch label="Remember me" disabled={props.disabled} />
        </FormField>

        <Button type="submit" class="w-full" disabled={props.disabled}>
          Sign in
        </Button>
        <Show when={success()}>
          <p class="text-xs text-primary font-medium text-center">Successfully signed in!</p>
        </Show>
      </Form>
    </div>
  )
}
