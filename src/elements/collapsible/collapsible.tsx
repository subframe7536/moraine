import * as KobalteCollapsible from '@kobalte/core/collapsible'
import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import { createControllableSignal } from '../../shared/create-controllable-signal'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

export namespace CollapsibleT {
  /**
   * Props passed to the trigger render function.
   */
  export interface RenderContext {
    /**
     * Whether the collapsible is open.
     */
    open: boolean
  }

  export type Slot = 'root' | 'trigger' | 'content'
  export type Variant = never
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = JSX.HTMLAttributes<HTMLDivElement>

  export interface Item {}
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
  const [local, rest] = splitProps(props, [
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'classes',
    'styles',
    'children',
    'trigger',
  ])

  const [open, setOpen] = createControllableSignal<boolean>({
    value: () => local.open,
    defaultValue: () => local.defaultOpen ?? false,
    onChange: local.onOpenChange,
  })

  return (
    <KobalteCollapsible.Root
      open={open()}
      disabled={local.disabled}
      onOpenChange={setOpen}
      data-slot="root"
      data-expanded={open() ? '' : undefined}
      data-closed={!open() ? '' : undefined}
      data-disabled={local.disabled ? '' : undefined}
      style={local.styles?.root}
      class={cn(local.classes?.root)}
      {...rest}
    >
      <Show when={local.trigger}>
        {(render) => (
          <KobalteCollapsible.Trigger
            data-slot="trigger"
            style={local.styles?.trigger}
            class={cn('cursor-pointer', local.classes?.trigger)}
          >
            {render()({ open: Boolean(open()) })}
          </KobalteCollapsible.Trigger>
        )}
      </Show>

      <KobalteCollapsible.Content
        data-slot="content"
        style={local.styles?.content}
        class={cn(
          'h-$kb-collapsible-content-height overflow-hidden data-closed:h-0',
          local.classes?.content,
        )}
      >
        {local.children}
      </KobalteCollapsible.Content>
    </KobalteCollapsible.Root>
  )
}
