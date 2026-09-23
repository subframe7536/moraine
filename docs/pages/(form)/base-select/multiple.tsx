import { BaseSelect, Button, Icon } from '@src'
import { For } from 'solid-js'

const FRAMEWORKS = [
  { value: 'solid', label: 'Solid' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
]

export default function Example() {
  return (
    <BaseSelect items={FRAMEWORKS} multiple defaultValue={['solid']} name="frameworks">
      <BaseSelect.Control>
        <BaseSelect.Trigger as={Button} variant="outline" class="min-w-52">
          {(state) => <span>{state.value.length} framework(s) selected</span>}
        </BaseSelect.Trigger>
      </BaseSelect.Control>
      <BaseSelect.Content>
        <BaseSelect.Listbox>
          <For each={FRAMEWORKS}>
            {(item) => (
              <BaseSelect.Item item={item}>
                {(state) => (
                  <>
                    <Icon
                      name="i-lucide:check"
                      class={state.selected ? 'opacity-100' : 'opacity-0'}
                    />
                    {state.item.label}
                  </>
                )}
              </BaseSelect.Item>
            )}
          </For>
        </BaseSelect.Listbox>
        <BaseSelect.Empty>No frameworks found.</BaseSelect.Empty>
      </BaseSelect.Content>
    </BaseSelect>
  )
}
