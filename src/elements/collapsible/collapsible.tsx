import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useDisclosureState } from '../../shared/use-disclosure-state.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { cn, useId } from '../../shared/utils.ts'

export namespace CollapsibleT {
  export interface TriggerProps {
    /** Stable id used by the content `aria-labelledby` relationship. */
    id: string

    /** Native button type. */
    type: 'button'

    /** Slot identity for the rendered trigger element. */
    'data-slot': 'trigger'

    /** Trigger class overrides. */
    class?: string

    /** Trigger style overrides. */
    style: JSX.CSSProperties | undefined

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
   * Props passed to the trigger render component.
   */
  export interface TriggerRenderProps {
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

    /** Custom trigger renderer. Spread `triggerProps` onto the interactive trigger element. */
    triggerRender: ComponentOrElement<TriggerRenderProps>

    /**
     * Content to render inside the collapsible.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Collapsible component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Collapsible component.
 */
export interface CollapsibleProps extends CollapsibleT.Props {}

/** Expandable content section with optional height transitions. */
export function Collapsible(props: CollapsibleProps): JSX.Element {
  const [, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'transition',
    'triggerRender',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
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
  const triggerRender = createMemo(() => props.triggerRender)

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
    'data-slot': 'trigger',
    get class() {
      return cn('w-full cursor-pointer', props.classes?.trigger)
    },
    get style() {
      return props.styles?.trigger
    },
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

  const triggerRenderProps: CollapsibleT.TriggerRenderProps = {
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

  const staticTrigger = (): JSX.Element => {
    const value = triggerRender()
    return typeof value === 'function' ? undefined : value
  }

  return (
    <div
      id={rootId()}
      data-slot="root"
      {...dataAttrs()}
      {...rest}
      style={{ ...props.styles?.root, ...props.style }}
      class={cn(props.classes?.root, props.class)}
    >
      <Show
        when={typeof triggerRender() === 'function'}
        fallback={<button {...triggerProps}>{staticTrigger()}</button>}
      >
        {renderComponentOrElement(triggerRender(), triggerRenderProps)}
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
