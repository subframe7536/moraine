import { Button, createForm, Input } from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

const schema = v.object({ title: v.pipe(v.string(), v.nonEmpty('A title is required.')) })

function saveDraft(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 2000))
}

export function AsyncSubmit() {
  const [saved, setSaved] = createSignal(false)
  const form = createForm({ schema, initialInput: { title: '' } })
  const handleSubmit = async () => {
    setSaved(false)
    await saveDraft()
    setSaved(true)
  }

  return (
    <form.Form onSubmit={handleSubmit} class="max-w-sm space-y-4">
      <form.Field name="title" label="Draft title" required>
        <Input placeholder="Quarterly update" />
      </form.Field>
      <Button
        type="submit"
        leading="i-lucide:save"
        loading={form.isSubmitting}
        disabled={form.isSubmitting}
      >
        Save draft
      </Button>
      <Show when={saved()}>
        <p class="text-success text-sm">Saved.</p>
      </Show>
    </form.Form>
  )
}
