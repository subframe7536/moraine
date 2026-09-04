import type { JSX, ValidComponent } from 'solid-js'
import { createMemo, createSignal, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useDisclosureState } from '../../shared/use-disclosure-state'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { cn, useId } from '../../shared/utils'

import { CollapsibleContent } from './collapsible-content'
import type { CollapsibleContext } from './collapsible-context'
import { CollapsibleProvider } from './collapsible-context'
import { CollapsibleTrigger } from './collapsible-trigger'
import { COLLAPSIBLE_ROOT_CLASS } from './collapsible.class'

type CollapsibleTriggerElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

export namespace CollapsibleT {
  export type TriggerBase<T extends ValidComponent = 'button'> = {
    /** Element or component to render as. @default 'button' */
    as?: T
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : T extends 'button'
        ? JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
        : T extends 'input'
          ? JSX.InputHTMLAttributes<HTMLInputElement>['type']
          : never
    /** Whether this trigger is disabled. */
    disabled?: boolean
    onClick?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, KeyboardEvent>
    onKeyUp?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, KeyboardEvent>
    onBlur?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, FocusEvent>
    onPointerDown?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, PointerEvent>
    /** Trigger label and visual content. */
    children?: JSX.Element
  }

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never
  >

  export type ContentBase<T extends ValidComponent = 'div'> = {
    /** Element or component to render inner content as. @default 'div' */
    as?: T
    /** Whether to unmount content when closed. @default true */
    unmountOnHide?: boolean
    /** Force mounting the content in the DOM even when closed. @default false */
    forceMount?: boolean
    /** Additional class applied to the outer animated height wrapper. */
    wrapperClass?: string
    /** Additional style applied to the outer animated height wrapper. */
    wrapperStyle?: JSX.CSSProperties
    /** Ref callback for the outer animated height wrapper element. */
    wrapperRef?: (element: HTMLDivElement | undefined) => void
    /** Content to render. */
    children?: JSX.Element
  }

  export type ContentProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    ContentBase<T>,
    never,
    never,
    never
  >

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
     * Whether to unmount collapsible content when closed.
     * @default true
     */
    unmountOnHide?: boolean

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
  const [local, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'transition',
    'unmountOnHide',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const config = useMoraineConfig()
  const provider = () => config().collapsible
  const resolved = resolveComponentStyle({
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
  const rootId = useId(() => local.id, 'collapsible')
  const contentId = createMemo(() => `${rootId()}-content`)
  const triggerId = createMemo(() => `${rootId()}-trigger`)
  const [open, setControlledOpen] = useControllableValue<boolean>({
    value: () => local.open,
    defaultValue: () => Boolean(local.defaultOpen),
  })
  const resolvedOpen = createMemo(() => Boolean(open()))
  const { contentHeight, dataAttrs, disabled, setContentElement } = useDisclosureState({
    open: resolvedOpen,
    disabled: () => Boolean(local.disabled),
  })
  const contentPresence = useTransitionPresence({ open: resolvedOpen })
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const transition = createMemo(() => Boolean(local.transition))
  const unmountOnHide = createMemo(() => local.unmountOnHide ?? true)

  function setOpen(nextOpen: boolean): void {
    if (disabled() || nextOpen === resolvedOpen()) {
      return
    }

    setControlledOpen(nextOpen)
    local.onOpenChange?.(nextOpen)
  }

  function toggleContent(): void {
    setOpen(!resolvedOpen())
  }

  const context: CollapsibleContext = {
    rootId,
    triggerId,
    contentId,
    open: resolvedOpen,
    setOpen,
    toggle: toggleContent,
    disabled,
    transition,
    unmountOnHide,
    dataAttrs,
    contentHeight,
    setContentElement: (element) => {
      if (element) {
        setContentElement(element)
      }
    },
    contentPresence,
    triggerElement,
    setTriggerElement,
    get classes() {
      return local.classes
    },
    get styles() {
      return local.styles
    },
  }

  return (
    <CollapsibleProvider value={context}>
      <div
        id={rootId()}
        data-slot="root"
        {...dataAttrs()}
        {...rest}
        style={resolved.rootStyle()}
        class={cn(COLLAPSIBLE_ROOT_CLASS, resolved.rootClass())}
      >
        {local.children}
      </div>
    </CollapsibleProvider>
  )
}

Collapsible.Trigger = CollapsibleTrigger
Collapsible.Content = CollapsibleContent
