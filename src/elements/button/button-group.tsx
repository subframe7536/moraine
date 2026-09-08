import type { JSX } from 'solid-js'
import { For, Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider/index.ts'

import { ButtonGroupContext } from './button-group-context.ts'
import type { ButtonGroupProps } from './button-group.types.ts'

export * from './button-group.types.ts'

/** Joins related buttons and provides shared size and visual variant defaults. */
export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'orientation',
    'role',
    'size',
    'variant',
    'separator',
    'classes',
    'styles',
    'class',
    'style',
    'children',
  ])
  const resolved = createComponentStyles('buttonGroup', local)

  const size = () => resolved.variants.size
  const variant = () => resolved.variants.variant

  function renderContent(): JSX.Element {
    const resolvedChildren = resolveChildren(() => local.children)
    const childArray = createMemo(() =>
      resolvedChildren
        .toArray()
        .filter(
          (child) =>
            typeof child === 'object' &&
            child !== null &&
            'nodeType' in child &&
            child.nodeType === 1,
        ),
    )

    return (
      <div role={local.role ?? 'group'} data-slot="root" {...rest} {...resolved.root}>
        <Show when={local.separator} fallback={resolvedChildren()}>
          <For each={childArray()}>
            {(child, index) => (
              <>
                <Show when={index() > 0}>
                  <span data-slot="separator" aria-hidden="true" {...resolved.slot('separator')} />
                </Show>
                {child}
              </>
            )}
          </For>
        </Show>
      </div>
    )
  }

  return (
    <ButtonGroupContext.Provider
      value={{
        get size() {
          return size()
        },
        get variant() {
          return variant()
        },
      }}
    >
      {renderContent()}
    </ButtonGroupContext.Provider>
  )
}
