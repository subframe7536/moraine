import { BaseSelect, Button } from '@src'
import { createSignal } from 'solid-js'

import { FrameworkListbox, frameworks } from './frameworks'

export default function Example() {
  const [submitted, setSubmitted] = createSignal('Not submitted')
  return (
    <form
      class="flex gap-2 items-start"
      onSubmit={(event) => {
        event.preventDefault()
        const value = new FormData(event.currentTarget).get('framework')
        setSubmitted(typeof value === 'string' ? value : 'No selection')
      }}
    >
      <BaseSelect items={frameworks} name="framework" required>
        <BaseSelect.Control>
          <BaseSelect.Trigger as={Button} variant="outline" class="min-w-52">
            {(state) => (
              <span>
                {frameworks.find((item) => item.value === state.value[0])?.label ??
                  'Select framework…'}
              </span>
            )}
          </BaseSelect.Trigger>
        </BaseSelect.Control>
        <BaseSelect.Content>
          <FrameworkListbox items={() => frameworks} />
        </BaseSelect.Content>
      </BaseSelect>
      <Button type="submit">Submit</Button>
      <output class="text-sm text-muted-foreground self-center">{submitted()}</output>
    </form>
  )
}
