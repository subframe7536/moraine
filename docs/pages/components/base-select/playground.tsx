import { BaseSelect, Button } from '@src'
import { For, Show } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const GROUPS = [
  {
    label: 'Client frameworks',
    items: [
      { value: 'solid', label: 'Solid' },
      { value: 'react', label: 'React' },
    ],
  },
  {
    label: 'Compiler-based frameworks',
    items: [
      { value: 'svelte', label: 'Svelte' },
      { value: 'astro', label: 'Astro' },
    ],
  },
]

const ITEMS = GROUPS.flatMap((group) => group.items)

export default function BaseSelectPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'switch', prop: 'empty', label: 'Empty list', defaultValue: false },
        { kind: 'switch', prop: 'multiple', label: 'Multiple', defaultValue: false },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'readOnly', label: 'Read-only', defaultValue: false },
      ]}
    >
      {(props) => (
        <BaseSelect
          items={props.empty ? [] : ITEMS}
          multiple={props.multiple}
          disabled={props.disabled}
          readOnly={props.readOnly}
          defaultValue={['solid']}
        >
          <BaseSelect.Control>
            <BaseSelect.Trigger as={Button} variant="outline" class="min-w-52 justify-between">
              {(state) =>
                state.value.length ? `${state.value.length} selected` : 'Select a framework…'
              }
            </BaseSelect.Trigger>
          </BaseSelect.Control>
          <BaseSelect.Content>
            <BaseSelect.Listbox>
              <Show when={!props.empty}>
                <For each={GROUPS}>
                  {(group, index) => (
                    <>
                      <Show when={index() > 0}>
                        <BaseSelect.Separator />
                      </Show>
                      <BaseSelect.Group>
                        <BaseSelect.GroupLabel>{group.label}</BaseSelect.GroupLabel>
                        <For each={group.items}>
                          {(item) => <BaseSelect.Item item={item}>{item.label}</BaseSelect.Item>}
                        </For>
                      </BaseSelect.Group>
                    </>
                  )}
                </For>
              </Show>
            </BaseSelect.Listbox>
            <BaseSelect.Empty>No frameworks found.</BaseSelect.Empty>
          </BaseSelect.Content>
        </BaseSelect>
      )}
    </DocsPlayground>
  )
}
