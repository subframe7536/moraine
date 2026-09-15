import { BaseSelect, Icon } from '@src'
import type { BaseSelectT } from '@src'
import { createMemo, For, Show } from 'solid-js'
import type { Accessor } from 'solid-js'

export interface FrameworkItem extends BaseSelectT.Item<string> {
  description: string
}

export const frameworkGroups = [
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
] satisfies Array<{ label: string; items: FrameworkItem[] }>

export const frameworks = frameworkGroups.flatMap((group) => group.items)

/** Reused listbox children for filtered and unfiltered BaseSelect examples. */
export function FrameworkListbox(props: { items: Accessor<readonly FrameworkItem[]> }) {
  const groups = createMemo(() => {
    const visible = new Set(props.items())
    return frameworkGroups
      .map((group) => ({
        label: group.label,
        items: group.items.filter((item) => visible.has(item)),
      }))
      .filter((group) => group.items.length)
  })
  return (
    <BaseSelect.Listbox>
      <For each={groups()}>
        {(group, index) => (
          <>
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
            <Show when={index() < groups().length - 1}>
              <BaseSelect.Separator />
            </Show>
          </>
        )}
      </For>
    </BaseSelect.Listbox>
  )
}
