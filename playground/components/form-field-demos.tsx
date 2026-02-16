import { createSignal } from 'solid-js'

import { Button, Form, FormField, Input, Select, Textarea } from '../../src'
import type { SelectOption } from '../../src/select/select'

import { DemoPage, DemoSection } from './common/demo-page'

const ROLE_OPTIONS: SelectOption[] = [
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Manager', value: 'manager' },
]

export const FormFieldDemos = () => {
  const [formState, setFormState] = createSignal({
    name: '',
    email: '',
    bio: '',
    role: '' as string | null,
  })

  const updateField = (field: string, value: string | null) => {
    setFormState((prev) => ({ ...prev, [field]: value ?? '' }))
  }

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Form & Validation"
      description="Form layout, field decoration, and validation integration."
    >
      <DemoSection
        title="Basic FormField"
        description="Labels, descriptions, hints, and required markers."
      >
        <div class="max-w-md space-y-4">
          <FormField
            name="username"
            label="Username"
            description="Your public display name."
            required
          >
            <Input placeholder="johndoe" />
          </FormField>
          <FormField name="website" label="Website" hint="Optional">
            <Input placeholder="https://example.com" />
          </FormField>
          <FormField name="notes" label="Notes" help="Markdown is supported.">
            <Textarea placeholder="Write something..." rows={2} />
          </FormField>
        </div>
      </DemoSection>

      <DemoSection title="Inline Error" description="Explicit error prop on FormField.">
        <div class="max-w-md">
          <FormField name="email" label="Email" error="Please enter a valid email address.">
            <Input placeholder="you@example.com" value="not-an-email" />
          </FormField>
        </div>
      </DemoSection>

      <DemoSection
        title="Form with Validation"
        description="Submit to trigger validation. Fix errors and resubmit."
      >
        <Form
          data-testid="demo-form"
          state={formState()}
          validate={(state) => {
            const errors: { name: string; message: string }[] = []

            if (!state?.name?.trim()) {
              errors.push({ name: 'name', message: 'Name is required.' })
            }

            if (!state?.email?.trim()) {
              errors.push({ name: 'email', message: 'Email is required.' })
            } else if (!state.email.includes('@')) {
              errors.push({ name: 'email', message: 'Enter a valid email.' })
            }

            if (!state?.bio?.trim()) {
              errors.push({ name: 'bio', message: 'Tell us about yourself.' })
            }

            return errors
          }}
        >
          <div class="max-w-md space-y-4">
            <FormField name="name" label="Name" required>
              <Input
                value={formState().name}
                onValueChange={(v) => updateField('name', String(v))}
                placeholder="Jane Doe"
              />
            </FormField>

            <FormField name="email" label="Email" required>
              <Input
                type="email"
                value={formState().email}
                onValueChange={(v) => updateField('email', String(v))}
                placeholder="jane@example.com"
              />
            </FormField>

            <FormField name="bio" label="Bio" required>
              <Textarea
                value={formState().bio}
                onValueChange={(v) => updateField('bio', String(v))}
                placeholder="A few words about you..."
                rows={3}
              />
            </FormField>

            <Button type="submit">Submit</Button>
          </div>
        </Form>
      </DemoSection>

      <DemoSection
        title="FormField with Select"
        description="Select integration inside a form field."
      >
        <Form
          state={formState()}
          validate={(state) => {
            if (!state?.role) {
              return [{ name: 'role', message: 'Please select a role.' }]
            }

            return []
          }}
        >
          <div class="max-w-sm space-y-4">
            <FormField name="role" label="Role" required>
              <Select
                options={ROLE_OPTIONS}
                value={formState().role}
                onChange={(v) => updateField('role', v as string | null)}
                placeholder="Choose a role..."
              />
            </FormField>
            <Button type="submit" variant="secondary">
              Validate
            </Button>
          </div>
        </Form>
      </DemoSection>
    </DemoPage>
  )
}
