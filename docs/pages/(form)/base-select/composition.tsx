import { BaseSelect, Button } from '@src'
import type { BaseSelectT } from '@src'
import { For, Show } from 'solid-js'

interface FrameworkItem extends BaseSelectT.Item<string> {
  description: string
}
const frameworks: FrameworkItem[] = [
  { value: 'solid', label: 'Solid', description: 'Fine-grained reactive UI' },
  { value: 'react', label: 'React', description: 'Component-based UI' },
]
export default function Example() {
  return (
    <form class="flex gap-3 items-center">
      <BaseSelect<FrameworkItem>
        items={frameworks}
        name="framework"
        defaultValue={['solid']}
        itemToLabelString={(item) => `${item.value} ${item.description}`}
      >
        <BaseSelect.Trigger as={Button}>
          {(state) => (
            <span>
              {frameworks.find((item) => item.value === state.value[0])?.label ??
                'Select framework'}
            </span>
          )}
        </BaseSelect.Trigger>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <BaseSelect.Group>
              <BaseSelect.GroupLabel>Frontend</BaseSelect.GroupLabel>
              <For each={frameworks}>
                {(item) => (
                  <BaseSelect.Item item={item}>
                    {(state) => (
                      <>
                        <span>
                          {state.item.label}
                          <small class="text-muted-foreground block">
                            {state.item.description}
                          </small>
                        </span>
                        <Show when={state.selected}>✓</Show>
                      </>
                    )}
                  </BaseSelect.Item>
                )}
              </For>
            </BaseSelect.Group>
            <BaseSelect.Separator />
          </BaseSelect.Listbox>
          <BaseSelect.Empty>No frameworks</BaseSelect.Empty>
        </BaseSelect.Content>
      </BaseSelect>
      <Button type="reset" variant="outline">
        Reset
      </Button>
    </form>
  )
}
