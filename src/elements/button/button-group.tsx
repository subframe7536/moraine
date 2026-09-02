import type { JSX } from 'solid-js'
import {
  For,
  Show,
  children as resolveChildren,
  mergeProps,
  splitProps,
  createMemo,
} from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'

import { ButtonGroupContext } from './button-group-context'
import type { ButtonGroupLayoutVariantProps } from './button-group.class'
import { buttonGroupVariants } from './button-group.class'
import type { ButtonVariantProps } from './button.class'

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
  const merged = mergeProps(
    {
      orientation: 'horizontal' as const,
      role: 'group' as const,
      size: 'md' as const,
      variant: 'default' as const,
      separator: false,
    },
    props,
  )
  const [local, rest] = splitProps(merged, [
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
        role={local.role}
        data-slot="root"
        data-orientation={local.orientation}
        data-size={local.size}
        data-variant={local.variant}
        style={{ ...local.styles?.root, ...local.style }}
        class={buttonGroupVariants(
          { orientation: local.orientation },
          local.classes?.root,
          local.class,
        )}
        {...rest}
      >
        <Show when={local.separator} fallback={resolvedChildren()}>
          <For each={childArray()}>
            {(child, index) => (
              <>
                <Show when={index() > 0}>
                  <span
                    data-slot="separator"
                    data-orientation={
                      local.orientation === 'horizontal' ? 'vertical' : 'horizontal'
                    }
                    aria-hidden="true"
                    class={cn(
                      'bg-input shrink-0 self-stretch',
                      local.orientation === 'horizontal' ? 'h-full w-px' : 'h-px w-full',
                      local.classes?.separator,
                    )}
                    style={local.styles?.separator}
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
          return local.size
        },
        get variant() {
          return local.variant
        },
      }}
    >
      {renderContent()}
    </ButtonGroupContext.Provider>
  )
}
