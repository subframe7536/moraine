import { BaseSelect, Button } from '@src'
import { createSignal, For } from 'solid-js'

const FRAMEWORKS = [
  { value: 'solid', label: 'Solid' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
]

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
      <BaseSelect items={FRAMEWORKS} name="framework" required>
        <BaseSelect.Control>
          <BaseSelect.Trigger as={Button} variant="outline" class="min-w-52">
            {(state) => (
              <span>
                {FRAMEWORKS.find((item) => item.value === state.value[0])?.label ??
                  'Select framework…'}
              </span>
            )}
          </BaseSelect.Trigger>
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <For each={FRAMEWORKS}>
              {(item) => <BaseSelect.Item item={item}>{item.label}</BaseSelect.Item>}
            </For>
          </BaseSelect.Listbox>
        </BaseSelect.Content>
      </BaseSelect>
      <Button type="submit">Submit</Button>
      <output class="text-sm text-muted-foreground self-center">{submitted()}</output>
    </form>
  )
}
