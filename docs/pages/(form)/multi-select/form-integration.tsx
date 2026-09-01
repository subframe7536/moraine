import { Button, createForm, MultiSelect } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

const TOPICS = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'SolidJS', value: 'solidjs' },
  { label: 'Tailwind CSS', value: 'tailwind' },
  { label: 'UnoCSS', value: 'unocss' },
  { label: 'Vite', value: 'vite' },
]

export function FormIntegration() {
  const [submittedTags, setSubmittedTags] = createSignal<string[]>([])
  const form = createForm({
    schema: v.object({
      topics: v.pipe(
        v.array(v.string()),
        v.minLength(2, 'Please select at least 2 relevant topics.'),
      ),
    }),
    initialInput: { topics: ['typescript'] },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmittedTags(output.topics)}>
      <div class="max-w-xl space-y-4">
        <form.Field
          name="topics"
          label="Interest Topics"
          description="Select at least 2 topics for your feed."
          required
        >
          <MultiSelect options={TOPICS} placeholder="Select topics..." />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">
            Selected topics: {submittedTags().length ? submittedTags().join(', ') : 'typescript'}
          </p>
        </div>
      </div>
    </form.Form>
  )
}
