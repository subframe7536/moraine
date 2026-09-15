import { BaseSelect, Button, Icon } from '@src'
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
    <BaseSelect<FrameworkItem>
      items={frameworks}
      itemToLabelString={(item) => `${item.value} ${item.description}`}
    >
      <BaseSelect.Trigger
        as={Button}
        variant="outline"
        class="justify-between min-w-52"
        trailing="i-lucide:chevrons-up-down"
      >
        {(state) => (
          <span>
            {frameworks.find((item) => item.value === state.value[0])?.label ??
              'Select framework…'}
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
                      <Icon
                        name="i-lucide:check"
                        class={state.selected ? 'opacity-100' : 'opacity-0'}
                      />
                      <span>
                        {state.item.label}
                        <small class="text-muted-foreground block">
                          {state.item.description}
                        </small>
                      </span>
                    </>
                  )}
                </BaseSelect.Item>
              )}
            </For>
          </BaseSelect.Group>
          <BaseSelect.Separator />
        </BaseSelect.Listbox>
        <BaseSelect.Empty>No frameworks found.</BaseSelect.Empty>
      </BaseSelect.Content>
    </BaseSelect>
  )
}
