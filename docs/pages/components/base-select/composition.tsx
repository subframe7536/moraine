import { BaseSelect, Button, Icon } from '@src'
import { For } from 'solid-js'

const GROUPS = [
  {
    label: 'Frontend',
    items: [
      { value: 'solid', label: 'Solid', description: 'Fine-grained reactive UI' },
      { value: 'react', label: 'React', description: 'Component-based UI' },
    ],
  },
  {
    label: 'Meta-frameworks',
    items: [
      { value: 'astro', label: 'Astro', description: 'Content-focused web framework' },
      { value: 'sveltekit', label: 'SvelteKit', description: 'Application framework for Svelte' },
    ],
  },
]

const FRAMEWORKS = GROUPS.flatMap((group) => group.items)

export default function Example() {
  return (
    <BaseSelect
      items={FRAMEWORKS}
      itemToLabelString={(item) => `${item.value} ${item.description}`}
    >
      <BaseSelect.Control>
        <BaseSelect.Trigger
          as={Button}
          variant="outline"
          class="min-w-52 justify-between"
          trailing="i-lucide:chevrons-up-down"
        >
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
          <For each={GROUPS}>
            {(group) => (
              <BaseSelect.Group>
                <BaseSelect.GroupLabel>{group.label}</BaseSelect.GroupLabel>
                <For each={group.items}>
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
            )}
          </For>
        </BaseSelect.Listbox>
        <BaseSelect.Empty>No frameworks found.</BaseSelect.Empty>
      </BaseSelect.Content>
    </BaseSelect>
  )
}
