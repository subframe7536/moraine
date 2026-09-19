import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callRef } from '../../shared/utils'

import { useCollapsibleContext } from './collapsible-context'
import { collapsibleRecipe } from './collapsible.recipe'
import type { CollapsibleT } from './collapsible.types'

/** Interactive trigger button for expanding/collapsing collapsible content. */
export function CollapsibleTrigger<T extends ValidComponent = 'button'>(
  props: CollapsibleT.TriggerProps<T>,
): JSX.Element {
  type RuntimeProps = CollapsibleT.TriggerBase<T> & {
    class?: string
    style?: JSX.CSSProperties
    ref?: (element: HTMLElement | undefined) => void
  } & Record<string, unknown>

  const [local, rest] = splitProps(props as RuntimeProps, [
    'as',
    'disabled',
    'children',
    'class',
    'style',
    'ref',
  ])
  const context = useCollapsibleContext()
  const resolved = createStyles(collapsibleRecipe, local, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.presentation,
  })
  const customAs = createMemo(() => local.as)
  const tag = createMemo(() => customAs() ?? 'button')
  const disabled = () => Boolean(context.disabled() || local.disabled)

  const handleRef = (element: HTMLElement | undefined) => {
    context.setTriggerElement(element)
    callRef(local.ref, element)

    if (element) {
      onCleanup(() => {
        if (context.triggerElement() === element) {
          context.setTriggerElement(undefined)
        }
        callRef(local.ref, undefined)
      })
    }
  }

  const interactionProps = useButtonInteraction(
    {
      disabled,
      disabledForComponent: true,
      onPress: () => context.toggle,
      tag,
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
          {...resolved.styles.trigger}
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
          {...interactionProps}
          component={as() as ValidComponent}
          {...resolved.styles.trigger}
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
