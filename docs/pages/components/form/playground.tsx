import { Button, createForm, Icon, Input, InputGroup, Select, Slider, Switch, Textarea } from '@src'
import { createSignal, Show } from 'solid-js'
import * as v from 'valibot'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const ProfileSchema = v.object({
  username: v.pipe(v.string(), v.minLength(3, 'Username must be at least 3 characters.')),
  role: v.pipe(v.string(), v.nonEmpty('Please select a role.')),
  experience: v.number(),
  bio: v.optional(v.string()),
  notifications: v.boolean(),
})

const ROLE_OPTIONS = [
  { label: 'Developer', value: 'dev' },
  { label: 'Designer', value: 'designer' },
  { label: 'Product Manager', value: 'pm' },
  { label: 'Other', value: 'other' },
]

export default function FormPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'orientation',
          label: 'Orientation',
          defaultValue: 'vertical',
          options: [
            { label: 'Vertical', value: 'vertical' },
            { label: 'Horizontal', value: 'horizontal' },
          ],
        },
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        { kind: 'switch', prop: 'required', label: 'Required', defaultValue: true },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'showDescription', label: 'Description', defaultValue: true },
        { kind: 'switch', prop: 'showHint', label: 'Hint', defaultValue: true },
        { kind: 'switch', prop: 'showHelp', label: 'Help text', defaultValue: false },
      ]}
    >
      {(props) => {
        const [submitted, setSubmitted] = createSignal<Record<string, unknown> | null>(null)
        const form = createForm({
          schema: ProfileSchema,
          initialInput: { username: '', role: '', experience: 3, bio: '', notifications: true },
        })

        return (
          <div class="max-w-lg w-full">
            <form.Form
              onSubmit={(values) => setSubmitted(values)}
              onReset={() => setSubmitted(null)}
            >
              <div class="space-y-4">
                <form.Field
                  name="username"
                  label="Username"
                  orientation={props.orientation}
                  size={props.size}
                  required={props.required}
                  hint={props.showHint ? (props.required ? 'Required' : undefined) : undefined}
                  description={props.showDescription ? 'Your unique public handle.' : undefined}
                  help={props.showHelp ? 'Visible to all members in workspace.' : undefined}
                >
                  <InputGroup>
                    <InputGroup.Leading>
                      <Icon name="i-lucide:user" />
                    </InputGroup.Leading>
                    <Input placeholder="alex_dev" disabled={props.disabled} />
                  </InputGroup>
                </form.Field>

                <form.Field
                  name="role"
                  label="Role"
                  orientation={props.orientation}
                  size={props.size}
                  required={props.required}
                  hint={props.showHint ? 'Team' : undefined}
                  description={
                    props.showDescription ? 'Your primary function on the team.' : undefined
                  }
                  help={props.showHelp ? 'Used to configure team permissions.' : undefined}
                >
                  <Select
                    items={ROLE_OPTIONS}
                    placeholder="Select a role"
                    disabled={props.disabled}
                    allowClear
                  />
                </form.Field>

                <form.Field
                  name="experience"
                  label="Experience"
                  orientation={props.orientation}
                  size={props.size}
                  hint={props.showHint ? '0–10 years' : undefined}
                  description={
                    props.showDescription ? 'Years of experience in your role.' : undefined
                  }
                  help={props.showHelp ? 'Choose a whole number of years.' : undefined}
                >
                  <Slider
                    defaultValue={3}
                    min={0}
                    max={10}
                    step={1}
                    size={props.size}
                    disabled={props.disabled}
                  />
                </form.Field>

                <form.Field
                  name="bio"
                  label="About"
                  orientation={props.orientation}
                  size={props.size}
                  hint={props.showHint ? 'Optional' : undefined}
                  description={
                    props.showDescription ? 'Brief introduction for your profile.' : undefined
                  }
                  help={props.showHelp ? 'Markdown is supported.' : undefined}
                >
                  <Textarea
                    placeholder="Tell us about yourself..."
                    rows={2}
                    disabled={props.disabled}
                  />
                </form.Field>

                <form.Field
                  name="notifications"
                  label={props.orientation === 'horizontal' ? 'Alerts' : undefined}
                  orientation={props.orientation}
                  size={props.size}
                >
                  <Switch
                    label="Email notifications"
                    description={
                      props.showDescription
                        ? 'Receive periodic digests and security updates'
                        : undefined
                    }
                    disabled={props.disabled}
                  />
                </form.Field>

                <div class="pt-2 flex gap-2 justify-end">
                  <Button
                    type="reset"
                    variant="outline"
                    size={props.size}
                    disabled={props.disabled || form.isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    size={props.size}
                    loading={form.isSubmitting}
                    disabled={props.disabled || form.isSubmitting}
                  >
                    Save Profile
                  </Button>
                </div>

                <Show when={submitted()}>
                  {(data) => (
                    <div class="text-xs font-mono mt-4 p-3 border border-border/80 rounded-lg bg-muted/40">
                      <p class="text-primary font-medium mb-1">Form Submitted:</p>
                      <pre class="text-foreground whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(data(), null, 2)}
                      </pre>
                    </div>
                  )}
                </Show>
              </div>
            </form.Form>
          </div>
        )
      }}
    </DocsPlayground>
  )
}
