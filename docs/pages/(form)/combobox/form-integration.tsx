import { Button, createForm, Combobox } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

const FRAMEWORKS = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'Vue.js', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Astro', value: 'astro' },
]

export function FormIntegration() {
  const [submitted, setSubmitted] = createSignal<string | null>(null)
  const form = createForm({
    schema: v.object({
      framework: v.pipe(
        v.nullable(v.string()),
        v.check(
          (value): value is string => value !== null && value.length > 0,
          'Please select a primary framework.',
        ),
      ),
    }),
    initialInput: { framework: null },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmitted(output.framework)}>
      <div class="max-w-xl space-y-4">
        <form.Field
          name="framework"
          label="Primary Framework"
          description="Used to configure your starter template and linting rules."
          required
        >
          <Combobox
            items={FRAMEWORKS}
            placeholder="Search and select framework..."
            leadingIcon="i-lucide:search"
            openOnControlClick
            allowClear
          />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-muted-foreground text-xs">
            Selected:{' '}
            <span class="text-foreground font-medium font-mono">{submitted() ?? 'none'}</span>
          </p>
        </div>
      </div>
    </form.Form>
  )
}
