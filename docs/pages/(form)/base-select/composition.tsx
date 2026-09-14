import { BaseSelect, Button } from '@src'
import type { BaseSelectT } from '@src'
import { For, Show, createSignal } from 'solid-js'

interface FrameworkItem extends BaseSelectT.Item<string> {
  description: string
}
const frameworks: FrameworkItem[] = [
  { value: 'solid', label: 'Solid', description: 'Fine-grained reactive UI' },
  { value: 'react', label: 'React', description: 'Component-based UI' },
]
const entries: BaseSelectT.Entry<FrameworkItem>[] = [
  { type: 'group', label: 'Frontend', items: frameworks },
]
export default function Example() {
  const [value, setValue] = createSignal<string | null>(null)
  return (
    <form class="flex gap-3 items-center">
      <BaseSelect<FrameworkItem>
        items={entries}
        name="framework"
        value={value()}
        onChange={setValue}
        itemToLabelString={(item) => `${item.value} ${item.description}`}
      >
        <BaseSelect.Trigger as={Button}>
          {(state) => state.selectedItems[0]?.label ?? 'Select framework'}
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
