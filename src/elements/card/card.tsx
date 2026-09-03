import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'

import type { CardVariantProps } from './card.class.ts'
import {
  CARD_BODY_MARGIN_COMPACT_CLASS,
  CARD_BODY_MARGIN_DEFAULT_CLASS,
  cardRecipe,
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
  export type Variant = CardVariantProps
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
     * Actions of the card.
     */
    action?: JSX.Element

    /**
     * Header of the card.
     */
    header?: JSX.Element

    /**
     * Footer of the card.
     */
    footer?: JSX.Element

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
  const config = useMoraineConfig()
  const provider = () => config().card

  const [local, rest] = splitProps(props, [
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
  const compact = () => local.compact ?? provider()?.defaultProps?.compact ?? false

  const header = createMemo(() => local.header)
  const title = createMemo(() => local.title)
  const description = createMemo(() => local.description)
  const action = createMemo(() => local.action)
  const footer = createMemo(() => local.footer)
  const resolvedChildren = resolveChildren(() => local.children)

  const slots = createMemo(() => cardRecipe({ compact: compact() }))

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

  return (
    <div data-slot="root" {...rest} style={resolved.rootStyle()} class={resolved.rootClass()}>
      <Show when={header() || title() || description()}>
        <div
          data-slot="header"
          style={resolved.slotStyle('header')}
          class={cn(resolved.slotClass('header'), action() && 'grid-cols-[1fr_auto]')}
        >
          <Show when={title() || description()} fallback={header()}>
            <Show when={title()}>
              <div
                data-slot="title"
                style={resolved.slotStyle('title')}
                class={resolved.slotClass('title')}
              >
                {title()}
              </div>
            </Show>
            <Show when={description()}>
              <p
                data-slot="description"
                style={resolved.slotStyle('description')}
                class={resolved.slotClass('description')}
              >
                {description()}
              </p>
            </Show>
            <Show when={action()}>
              <div
                data-slot="action"
                style={resolved.slotStyle('action')}
                class={resolved.slotClass('action')}
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
            style={resolved.slotStyle('body')}
            class={cn(
              resolved.slotClass('body'),
              !footer() &&
                (compact() ? CARD_BODY_MARGIN_COMPACT_CLASS : CARD_BODY_MARGIN_DEFAULT_CLASS),
            )}
          >
            {body()}
          </div>
        )}
      </Show>

      <Show when={footer()}>
        <div
          data-slot="footer"
          style={resolved.slotStyle('footer')}
          class={resolved.slotClass('footer')}
        >
          {footer()}
        </div>
      </Show>
    </div>
  )
}
