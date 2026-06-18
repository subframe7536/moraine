import type { JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useDisclosureState } from '../../shared/use-disclosure-state'
import { callHandler, cn, useId } from '../../shared/utils'

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

  export interface Slot<T = unknown> {
    /** Container that owns the trigger and expandable content state. */
    root?: T

    /** Button users activate to toggle the content visibility. */
    trigger?: T

    /** Region that is mounted for the expanded collapsible content. */
    content?: T
  }
  export type Variant = never
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Extend = never

  export interface Item {}
  /**
   * Base props for the Collapsible component.
   */
  export interface Base {
    /**
     * Unique identifier for the collapsible root element.
     */
    id?: string

    /**
     * Whether the collapsible is open (controlled).
     */
    open?: boolean

    /**
     * Whether the collapsible is open by default (uncontrolled).
     * @default false
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
  export interface Props extends BaseProps<Base, Variant, Extend, Classes, Styles> {}
}

/**
 * Props for the Collapsible component.
 */
export interface CollapsibleProps extends CollapsibleT.Props {}

/** Expandable content section with animated open/close transitions. */
export function Collapsible(props: CollapsibleProps): JSX.Element {
  const rootId = useId(() => props.id, 'collapsible')
  const contentId = createMemo(() => `${rootId()}-content`)
  const triggerId = createMemo(() => `${rootId()}-trigger`)
  const [open, setControlledOpen] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => Boolean(props.defaultOpen),
  })
  const resolvedOpen = createMemo(() => Boolean(open()))
  const { contentHeight, dataAttrs, disabled, setContentElement } = useDisclosureState({
    open: resolvedOpen,
    disabled: () => Boolean(props.disabled),
  })

  function setOpen(nextOpen: boolean): void {
    if (disabled() || nextOpen === resolvedOpen()) {
      return
    }

    setControlledOpen(nextOpen)

    props.onOpenChange?.(nextOpen)
  }

  function onTriggerClick(event: MouseEvent): void {
    const { defaultPrevented } = callHandler(event, undefined)

    if (!defaultPrevented) {
      setOpen(!open())
    }
  }

  return (
    <div
      id={rootId()}
      data-slot="root"
      style={props.styles?.root}
      class={cn(props.classes?.root)}
      {...dataAttrs()}
    >
      <Show when={props.trigger}>
        {(render) => {
          return (
            <button
              id={triggerId()}
              type="button"
              aria-controls={contentId()}
              aria-expanded={resolvedOpen()}
              disabled={disabled()}
              data-slot="trigger"
              style={props.styles?.trigger}
              class={cn('cursor-pointer', props.classes?.trigger)}
              onClick={onTriggerClick}
              {...dataAttrs()}
            >
              {render()({ open: resolvedOpen() })}
            </button>
          )
        }}
      </Show>

      <Show when={props.forceMount || resolvedOpen()}>
        <div
          ref={setContentElement}
          id={contentId()}
          aria-labelledby={triggerId()}
          data-slot="content"
          style={{
            '--mo-collapsible-content-height': `${contentHeight()}px`,
            ...(props.styles?.content as JSX.CSSProperties | undefined),
          }}
          class={cn(
            'h-$mo-collapsible-content-height transition-[height] overflow-hidden data-closed:h-0',
            props.classes?.content,
          )}
          {...dataAttrs()}
        >
          {props.children}
        </div>
      </Show>
    </div>
  )
}
