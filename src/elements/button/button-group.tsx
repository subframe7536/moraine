import type { JSX } from 'solid-js'
import { For, Show, children as resolveChildren, splitProps, createMemo } from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'

import { ButtonGroupContext } from './button-group-context.ts'
import type { ButtonGroupProps } from './button-group.types.ts'

export * from './button-group.types.ts'

/** Joins related buttons and provides shared size and visual variant defaults. */
export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  const design = useMoraineDesign()
  const buttonGroupDesign = () => design().buttonGroup

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

  const orientation = () =>
    local.orientation ?? buttonGroupDesign()?.defaultVariants?.orientation ?? 'horizontal'
  const size = () => local.size ?? buttonGroupDesign()?.defaultVariants?.size
  const variant = () => local.variant ?? buttonGroupDesign()?.defaultVariants?.variant

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return buttonGroupDesign()?.recipe({ orientation: orientation() })
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

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
      <div
        role={local.role ?? 'group'}
        data-slot="root"
        data-orientation={orientation()}
        data-size={size()}
        data-variant={variant()}
        {...rest}
        {...resolved.rootClassAndStyle()}
      >
        <Show when={local.separator} fallback={resolvedChildren()}>
          <For each={childArray()}>
            {(child, index) => (
              <>
                <Show when={index() > 0}>
                  <span
                    data-slot="separator"
                    data-orientation={orientation() === 'horizontal' ? 'vertical' : 'horizontal'}
                    aria-hidden="true"
                    {...resolved.slotClassAndStyle('separator')}
                  />
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
