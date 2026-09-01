import { Button, createForm, Input } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

const schema = v.object({ name: v.pipe(v.string(), v.nonEmpty('A name is required.')) })

export function Reset() {
  const [resetCount, setResetCount] = createSignal(0)
  const form = createForm({ schema, initialInput: { name: 'Draft document' } })

  return (
    <form.Form onReset={() => setResetCount((count) => count + 1)} class="max-w-sm space-y-4">
      <form.Field name="name" label="Name">
        <Input />
      </form.Field>
      <div class="flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="reset" variant="outline">
          Reset
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">Reset events: {resetCount()}</p>
    </form.Form>
  )
}
