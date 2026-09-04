import type { JSX, ValidComponent } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callRef, cn } from '../../shared/utils'

import type { CollapsibleT } from './collapsible'
import { useCollapsibleContext } from './collapsible-context'
import { COLLAPSIBLE_TRIGGER_CLASS } from './collapsible.class'

type CollapsibleTriggerElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

/** Interactive trigger button for expanding/collapsing collapsible content. */
export function CollapsibleTrigger<T extends ValidComponent = 'button'>(
  props: CollapsibleT.TriggerProps<T>,
): JSX.Element {
  type RuntimeProps = CollapsibleT.TriggerBase<T> & {
    class?: string
    style?: JSX.CSSProperties
    ref?: (element: CollapsibleTriggerElementFor<T> | undefined) => void
  } & Record<string, unknown>

  const [local, rest] = splitProps(props as RuntimeProps, [
    'as',
    'type',
    'disabled',
    'children',
    'class',
    'style',
    'ref',
  ])
  const context = useCollapsibleContext()
  const customAs = createMemo(() => local.as)
  const tag = createMemo(() => customAs() ?? 'button')
  const disabled = () => Boolean(context.disabled() || local.disabled)

  const handleRef = (element: HTMLElement | undefined) => {
    context.setTriggerElement(element)
    callRef(local.ref as ((el: HTMLElement | undefined) => void) | undefined, element)

    if (element) {
      onCleanup(() => {
        if (context.triggerElement() === element) {
          context.setTriggerElement(undefined)
        }
        callRef(local.ref as ((el: HTMLElement | undefined) => void) | undefined, undefined)
      })
    }
  }

  const interactionProps = useButtonInteraction<CollapsibleTriggerElementFor<T>>(
    {
      disabled,
      disabledForComponent: true,
      onPress: () => context.toggle,
      tag,
      type: () => local.type,
      typeForComponent: true,
    },
    rest,
  )
  const children = resolveChildren(() => local.children)

  return (
    <Show
      when={customAs()}
      fallback={
        <button
          id={context.triggerId()}
          data-slot="trigger"
          {...(interactionProps as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}
          style={local.style}
          class={cn(COLLAPSIBLE_TRIGGER_CLASS, local.class)}
          aria-controls={context.open() ? context.contentId() : undefined}
          aria-expanded={context.open()}
          {...context.dataAttrs()}
          data-disabled={disabled() ? '' : undefined}
          ref={(el) => handleRef(el)}
        >
          {children()}
        </button>
      }
    >
      {(as) => (
        <Dynamic
          id={context.triggerId()}
          data-slot="trigger"
          {...(interactionProps as Record<string, unknown>)}
          component={as() as ValidComponent}
          style={local.style}
          class={cn(COLLAPSIBLE_TRIGGER_CLASS, local.class)}
          aria-controls={context.open() ? context.contentId() : undefined}
          aria-expanded={context.open()}
          {...context.dataAttrs()}
          data-disabled={disabled() ? '' : undefined}
          ref={(el: HTMLElement | undefined) => handleRef(el)}
        >
          {children()}
        </Dynamic>
      )}
    </Show>
  )
}
