import type { JSX } from 'solid-js'
import { For, Show, children as resolveChildren, splitProps, createMemo } from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'

import { ButtonGroupContext } from './button-group-context.ts'
import type { ButtonGroupLayoutVariantProps } from './button-group.class.ts'
import { buttonGroupRecipe } from './button-group.class.ts'
import type { ButtonVariantProps } from './button.class.ts'

export namespace ButtonGroupT {
  export interface Slot<T = unknown> {
    /** Container that joins the edges of its direct button children. */
    root?: T
    /** Separator element between buttons. */
    separator?: T
  }
  export type Variant = ButtonGroupLayoutVariantProps & ButtonVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}
  /** Base props for the ButtonGroup component. */
  export interface Base {
    /** Optional identifier for the group root. */
    id?: string
    /** ARIA role for the group root. */
    role?: JSX.AriaAttributes['role']
    /** Buttons or compatible controls rendered as a cohesive group. */
    children?: JSX.Element
    /** Whether to render a decorative separator between adjacent controls. */
    separator?: boolean
  }

  /** Props for the ButtonGroup component. */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/** Props for the ButtonGroup component. */
export interface ButtonGroupProps extends ButtonGroupT.Props {}

/** Joins related buttons and provides shared size and visual variant defaults. */
export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  const config = useMoraineConfig()
  const provider = () => config().buttonGroup

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
    (local.orientation ?? provider()?.variants?.orientation ?? 'horizontal') as NonNullable<
      ButtonGroupLayoutVariantProps['orientation']
    >
  const size = () => local.size ?? provider()?.variants?.size ?? 'md'
  const variant = () => local.variant ?? provider()?.variants?.variant ?? 'default'

  const slots = createMemo(() => buttonGroupRecipe({ orientation: orientation() }))

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
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
        style={resolved.rootStyle()}
        class={resolved.rootClass()}
        {...rest}
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
                    class={cn(
                      orientation() === 'horizontal' ? 'h-full w-px' : 'h-px w-full',
                      resolved.slotClass('separator'),
                    )}
                    style={resolved.slotStyle('separator')}
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
