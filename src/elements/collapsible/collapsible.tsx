import * as KobalteCollapsible from '@kobalte/core/collapsible'
import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

export namespace CollapsibleT {
  export type Slot = 'root' | 'trigger' | 'content'
  export interface Variant {}
  export interface Items {}
  export type Extend = KobalteCollapsible.CollapsibleRootProps
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

  /**
   * Props passed to the trigger render function.
   */
  export interface RenderContext {
    /**
     * Whether the collapsible is open.
     */
    open: boolean
  }

  /**
   * Base props for the Collapsible component.
   */
  export interface Base {
    /**
     * Whether the collapsible is open (controlled).
     */
    open?: boolean

    /**
     * Whether the collapsible is open by default (uncontrolled).
     */
    defaultOpen?: boolean

    /**
     * Callback when the open state changes.
     */
    onOpenChange?: (open: boolean) => void

    /**
     * Whether the collapsible is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether to force mount the content.
     * @default false
     */
    forceMount?: boolean

    /**
     * Custom trigger render function.
     */
    trigger?: (props: RenderContext) => JSX.Element

    /**
     * Content to render inside the collapsible.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Collapsible component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Collapsible component.
 */
export interface CollapsibleProps extends CollapsibleT.Props {}

/** Expandable content section with animated open/close transitions. */
export function Collapsible(props: CollapsibleProps): JSX.Element {
  const [contentProps, restProps] = splitProps(props as CollapsibleProps, [
    'classes',
    'styles',
    'children',
    'trigger',
  ])

  return (
    <KobalteCollapsible.Root
      data-slot="root"
      style={contentProps.styles?.root}
      class={cn(contentProps.classes?.root)}
      {...restProps}
    >
      <Show when={contentProps.trigger}>
        {(render) => {
          const context = KobalteCollapsible.useCollapsibleContext()
          return (
            <KobalteCollapsible.Trigger
              data-slot="trigger"
              style={contentProps.styles?.trigger}
              class={cn('cursor-pointer', contentProps.classes?.trigger)}
            >
              {render()({ open: context.isOpen() })}
            </KobalteCollapsible.Trigger>
          )
        }}
      </Show>

      <KobalteCollapsible.Content
        data-slot="content"
        style={contentProps.styles?.content}
        class={cn(
          'h-$kb-collapsible-content-height overflow-hidden data-closed:h-0',
          contentProps.classes?.content,
        )}
      >
        {contentProps.children}
      </KobalteCollapsible.Content>
    </KobalteCollapsible.Root>
  )
}
