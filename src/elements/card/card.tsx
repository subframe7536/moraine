import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'

import {
  CARD_ACTION_CLASS,
  CARD_BODY_CLASS,
  CARD_BODY_COMPACT_CLASS,
  CARD_BODY_DEFAULT_CLASS,
  CARD_BODY_MARGIN_COMPACT_CLASS,
  CARD_BODY_MARGIN_DEFAULT_CLASS,
  CARD_DESCRIPTION_CLASS,
  CARD_FOOTER_COMPACT_CLASS,
  CARD_FOOTER_DEFAULT_CLASS,
  CARD_HEADER_CLASS,
  CARD_HEADER_COMPACT_CLASS,
  CARD_HEADER_DEFAULT_CLASS,
  CARD_ROOT_CLASS,
  CARD_TITLE_CLASS,
} from './card.class.ts'

export namespace CardT {
  export interface Slot<T = unknown> {
    /**
     * Card container that frames the header, body, and footer regions.
     */
    root?: T

    /** Top region for title, description, custom header content, and actions. */
    header?: T

    /** Primary heading rendered in the card header. */
    title?: T

    /** Supporting text rendered below the card title. */
    description?: T

    /** Header action region, typically used for buttons or menus. */
    action?: T

    /** Main content region for the card children. */
    body?: T

    /** Bottom region for secondary actions or summary content. */
    footer?: T
  }
  export type Variant = never
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}
  /**
   * Base props for the Card component.
   */
  export interface Base {
    /**
     * Whether to use a compact layout.
     * @default false
     */
    compact?: boolean

    /**
     * Title of the card.
     */
    title?: JSX.Element

    /**
     * Description of the card.
     */
    description?: JSX.Element

    /**
     * Content to render in the header slot, overrides title/description.
     */
    header?: JSX.Element

    /**
     * Content to render in the footer slot.
     */
    footer?: JSX.Element

    /**
     * Content to render in the action slot (usually a button in the header).
     */
    action?: JSX.Element

    /**
     * Children of the card.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Card component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Card component.
 */
export interface CardProps extends CardT.Props {}

/** Structured content container with optional header, body, footer, and action slots. */
export function Card(props: CardProps): JSX.Element {
  const [, rest] = splitProps(props, [
    'header',
    'title',
    'description',
    'action',
    'footer',
    'compact',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const header = createMemo(() => props.header)
  const title = createMemo(() => props.title)
  const description = createMemo(() => props.description)
  const action = createMemo(() => props.action)
  const footer = createMemo(() => props.footer)
  const resolvedChildren = resolveChildren(() => props.children)

  return (
    <div
      data-slot="root"
      {...rest}
      style={{ ...props.styles?.root, ...props.style }}
      class={cn(CARD_ROOT_CLASS, props.classes?.root, props.class)}
    >
      <Show when={header() || title() || description()}>
        <div
          data-slot="header"
          style={props.styles?.header}
          class={cn(
            CARD_HEADER_CLASS,
            !header() && (props.compact ? CARD_HEADER_COMPACT_CLASS : CARD_HEADER_DEFAULT_CLASS),
            action() && 'grid-cols-[1fr_auto]',
            props.classes?.header,
          )}
        >
          <Show when={title() || description()} fallback={header()}>
            <Show when={title()}>
              <div
                data-slot="title"
                style={props.styles?.title}
                class={cn(CARD_TITLE_CLASS, props.classes?.title)}
              >
                {title()}
              </div>
            </Show>
            <Show when={description()}>
              <p
                data-slot="description"
                style={props.styles?.description}
                class={cn(CARD_DESCRIPTION_CLASS, props.classes?.description)}
              >
                {description()}
              </p>
            </Show>
            <Show when={action()}>
              <div
                data-slot="action"
                style={props.styles?.action}
                class={cn(CARD_ACTION_CLASS, props.classes?.action)}
              >
                {action()}
              </div>
            </Show>
          </Show>
        </div>
      </Show>

      <Show when={resolvedChildren()}>
        {(body) => (
          <div
            data-slot="body"
            style={props.styles?.body}
            class={cn(
              CARD_BODY_CLASS,
              props.compact ? CARD_BODY_COMPACT_CLASS : CARD_BODY_DEFAULT_CLASS,
              !footer() &&
                (props.compact ? CARD_BODY_MARGIN_COMPACT_CLASS : CARD_BODY_MARGIN_DEFAULT_CLASS),
              props.classes?.body,
            )}
          >
            {body()}
          </div>
        )}
      </Show>

      <Show when={footer()}>
        <div
          data-slot="footer"
          style={props.styles?.footer}
          class={cn(
            props.compact ? CARD_FOOTER_COMPACT_CLASS : CARD_FOOTER_DEFAULT_CLASS,
            props.classes?.footer,
          )}
        >
          {footer()}
        </div>
      </Show>
    </div>
  )
}
