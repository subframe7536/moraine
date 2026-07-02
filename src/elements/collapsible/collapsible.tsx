import type { Component, JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useDisclosureState } from '../../shared/use-disclosure-state'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { cn, useId } from '../../shared/utils'

export namespace CollapsibleT {
  export interface TriggerProps {
    /** Stable id used by the content `aria-labelledby` relationship. */
    id: string

    /** Native button type. */
    type: 'button'

    /** Content id while the collapsible is open. */
    'aria-controls'?: string

    /** Whether the controlled content is open. */
    'aria-expanded': boolean

    /** Whether the trigger is disabled. */
    disabled: boolean

    /** Present while the collapsible is closed. */
    'data-closed'?: string

    /** Present while the collapsible is disabled. */
    'data-disabled'?: string

    /** Present while the collapsible is open. */
    'data-expanded'?: string

    /** Click handler that toggles the content. */
    onClick: (event: MouseEvent) => void
  }

  /**
   * Props passed to the trigger render function.
   */
  export interface RenderTriggerContext {
    /**
     * Whether the collapsible is open.
     */
    isOpen: boolean

    /**
     * Whether the collapsible is disabled.
     */
    disabled: boolean

    /** Opens the collapsible content. */
    open: VoidFunction

    /** Closes the collapsible content. */
    close: VoidFunction

    /** Toggles the collapsible content. */
    toggle: VoidFunction

    /**
     * Button props for the element that should toggle the content.
     */
    triggerProps: TriggerProps
  }

  export interface Slot<T = unknown> {
    /**
     * Container that owns the trigger and expandable content state.
     */
    root?: T

    /** Button users activate to toggle the content visibility. */
    trigger?: T

    /** Region that is mounted for the expanded collapsible content. */
    content?: T
  }
  export type Variant = never
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

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
     * Whether to keep content mounted until its height transition completes.
     * @default false
     */
    transition?: boolean

    /**
     * Custom trigger content or render function.
     * - When component has no prop, the whole component will be wrapped with `<button>`
     * - When component has props, uncontrolled state must be setup manually via `CollapsibleT.RenderTriggerContext`
     */
    renderTrigger: JSX.Element | Component<RenderTriggerContext>

    /**
     * Content to render inside the collapsible.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Collapsible component.
   */
  export interface Props extends BaseProps<Base, Variant, never, Classes, Styles> {}
}

/**
 * Props for the Collapsible component.
 */
export interface CollapsibleProps extends CollapsibleT.Props {}

/** Expandable content section with optional height transitions. */
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
  const contentPresence = useTransitionPresence({
    open: resolvedOpen,
    mode: 'transition',
  })
  const shouldRenderContent = createMemo(
    () => resolvedOpen() || (Boolean(props.transition) && contentPresence.present()),
  )

  function setOpen(nextOpen: boolean): void {
    if (disabled() || nextOpen === resolvedOpen()) {
      return
    }

    setControlledOpen(nextOpen)
    props.onOpenChange?.(nextOpen)
  }

  function toggleContent(): void {
    setOpen(!resolvedOpen())
  }

  function onTriggerClick(event: MouseEvent): void {
    if (!event.defaultPrevented) {
      toggleContent()
    }
  }

  const triggerProps: CollapsibleT.TriggerProps = {
    get id() {
      return triggerId()
    },
    type: 'button',
    get 'aria-controls'() {
      return resolvedOpen() ? contentId() : undefined
    },
    get 'aria-expanded'() {
      return resolvedOpen()
    },
    get disabled() {
      return disabled()
    },
    get 'data-closed'() {
      return dataAttrs()['data-closed']
    },
    get 'data-disabled'() {
      return dataAttrs()['data-disabled']
    },
    get 'data-expanded'() {
      return dataAttrs()['data-expanded']
    },
    onClick: onTriggerClick,
  }

  const triggerContext: CollapsibleT.RenderTriggerContext = {
    get isOpen() {
      return resolvedOpen()
    },
    get disabled() {
      return disabled()
    },
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: toggleContent,
    triggerProps,
  }

  return (
    <div
      id={rootId()}
      data-slot="root"
      style={{ ...props.styles?.root, ...props.style }}
      class={cn(props.classes?.root, props.class)}
      {...dataAttrs()}
    >
      <Show
        when={typeof props.renderTrigger === 'function' && props.renderTrigger.length > 0}
        fallback={
          <Show when={props.renderTrigger}>
            <button
              {...triggerProps}
              data-slot="trigger"
              style={props.styles?.trigger}
              class={cn('w-full cursor-pointer', props.classes?.trigger)}
            >
              {props.renderTrigger as JSX.Element}
            </button>
          </Show>
        }
      >
        <div
          data-slot="trigger"
          style={props.styles?.trigger}
          class={cn(props.classes?.trigger)}
          {...dataAttrs()}
        >
          {(props.renderTrigger as Component<CollapsibleT.RenderTriggerContext>)(triggerContext)}
        </div>
      </Show>

      <Show when={shouldRenderContent()}>
        <div
          ref={(element) => {
            setContentElement(element)
            contentPresence.setElement(element)
          }}
          id={contentId()}
          aria-labelledby={triggerId()}
          data-slot="content-wrapper"
          style={{
            '--mo-collapsible-content-height': `${contentHeight()}px`,
          }}
          class={cn(
            'h-$mo-collapsible-content-height overflow-hidden data-closed:h-0',
            props.transition && 'transition-[height]',
          )}
          {...dataAttrs()}
        >
          <div data-slot="content" style={props.styles?.content} class={cn(props.classes?.content)}>
            {props.children}
          </div>
        </div>
      </Show>
    </div>
  )
}
