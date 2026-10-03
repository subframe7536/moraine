import { Button, CheckboxGroup, createForm } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

const ROLE_OPTIONS = [
  { label: 'Read repository', value: 'read' },
  { label: 'Write changes', value: 'write' },
  { label: 'Admin access', value: 'admin' },
]

export function FormIntegration() {
  const [submitted, setSubmitted] = createSignal<string[]>([])
  const form = createForm({
    schema: v.object({
      permissions: v.pipe(
        v.array(v.string()),
        v.minLength(1, 'Select at least one permission role.'),
      ),
    }),
    initialInput: { permissions: ['read'] },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmitted(output.permissions)}>
      <div class="max-w-xl space-y-4">
        <form.Field
          name="permissions"
          label="Role permissions"
          description="Assigned permissions for team members."
          required
        >
          <CheckboxGroup items={ROLE_OPTIONS} />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">
            Active roles: {submitted().length ? submitted().join(', ') : 'read'}
          </p>
        </div>
      </div>
    </form.Form>
  )
}
