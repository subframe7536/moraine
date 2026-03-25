import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

export namespace CardT {
  export type Slot = 'root' | 'header' | 'title' | 'description' | 'action' | 'body' | 'footer'
  export interface Variant {}
  export interface Items {}
  export interface Extend {}
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

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
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Card component.
 */
export interface CardProps extends CardT.Props {}

/** Structured content container with optional header, body, footer, and action slots. */
export function Card(props: CardProps): JSX.Element {
  return (
    <div
      data-slot="root"
      style={props.styles?.root}
      class={cn(
        'text-card-foreground b-1 b-border rounded-2xl bg-card flex flex-col shadow-xs/5 relative not-dark:bg-clip-padding',
        props.classes?.root,
      )}
    >
      <Show when={props.header || props.title || props.description}>
        <div
          data-slot="header"
          style={props.styles?.header}
          class={cn(
            'grid auto-rows-min items-start',
            !props.header && (props.compact ? 'p-4 gap-1' : 'p-6 gap-2'),
            props.action && 'grid-cols-[1fr_auto]',
            props.classes?.header,
          )}
        >
          <Show when={props.title || props.description} fallback={props.header}>
            <Show when={props.title}>
              <div
                data-slot="title"
                style={props.styles?.title}
                class={cn('text-lg leading-none font-semibold', props.classes?.title)}
              >
                {props.title}
              </div>
            </Show>
            <Show when={props.description}>
              <p
                data-slot="description"
                style={props.styles?.description}
                class={cn('text-sm text-muted-foreground', props.classes?.description)}
              >
                {props.description}
              </p>
            </Show>
            <Show when={props.action}>
              <div
                data-slot="action"
                style={props.styles?.action}
                class={cn(
                  'inline-flex row-span-2 col-start-2 row-start-1 self-start justify-self-end',
                  props.classes?.action,
                )}
              >
                {props.action}
              </div>
            </Show>
          </Show>
        </div>
      </Show>

      <Show when={props.children}>
        <div
          data-slot="body"
          style={props.styles?.body}
          class={cn(
            'flex-1',
            props.compact ? 'px-4' : 'px-6',
            !props.footer && (props.compact ? 'mb-4' : 'mb-6'),
            props.classes?.body,
          )}
        >
          {props.children}
        </div>
      </Show>

      <Show when={props.footer}>
        <div
          data-slot="footer"
          style={props.styles?.footer}
          class={cn(props.compact ? 'p-4' : 'p-6', props.classes?.footer)}
        >
          {props.footer}
        </div>
      </Show>
    </div>
  )
}
