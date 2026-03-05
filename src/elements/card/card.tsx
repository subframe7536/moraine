import type { JSX, ParentProps } from 'solid-js'
import { Show } from 'solid-js'

import type { SlotClasses } from '../../shared/slot-class'
import { cn } from '../../shared/utils'

type CardSlots = 'root' | 'header' | 'title' | 'description' | 'action' | 'body' | 'footer'

export type CardClasses = SlotClasses<CardSlots>

export interface CardBaseProps {
  compact?: boolean
  title?: JSX.Element
  description?: JSX.Element
  header?: JSX.Element
  footer?: JSX.Element
  action?: JSX.Element
  classes?: CardClasses
}

export type CardProps = ParentProps<CardBaseProps>

export function Card(props: CardProps): JSX.Element {
  return (
    <div
      data-slot="root"
      class={cn(
        'relative flex flex-col rounded-2xl border bg-card not-dark:bg-clip-padding text-card-foreground shadow-xs/5',
        props.classes?.root,
      )}
    >
      <Show when={props.header || props.title || props.description}>
        <div
          data-slot="header"
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
                class={cn('font-semibold text-lg leading-none', props.classes?.title)}
              >
                {props.title}
              </div>
            </Show>
            <Show when={props.description}>
              <p
                data-slot="description"
                class={cn('text-sm text-muted-foreground', props.classes?.description)}
              >
                {props.description}
              </p>
            </Show>
            <Show when={props.action}>
              <div
                data-slot="action"
                class={cn(
                  'col-start-2 row-span-2 row-start-1 self-start justify-self-end inline-flex',
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
          class={cn('flex-1', props.compact ? 'px-4' : 'px-6', props.classes?.body)}
        >
          {props.children}
        </div>
      </Show>

      <Show when={props.footer}>
        <div data-slot="footer" class={cn(props.compact ? 'p-4' : 'p-6', props.classes?.footer)}>
          {props.footer}
        </div>
      </Show>
    </div>
  )
}
