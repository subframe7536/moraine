import type { Accessor, JSX } from 'solid-js'
import { children as resolveChildren, onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callRef } from '../../shared/utils'

import { useCollapsibleContext } from './collapsible-context'
import { collapsibleDataAttributes, collapsibleRecipe } from './collapsible.recipe'
import type { CollapsibleT } from './collapsible.types'

/** Interactive trigger button for expanding/collapsing collapsible content. */
export function CollapsibleTrigger<T extends ValidComponent = 'button'>(
  props: CollapsibleT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'disabled',
    'children',
    'class',
    'style',
    'ref' as any,
  ])
  const context = useCollapsibleContext()
  const resolved = createStyles(collapsibleRecipe, local, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.presentation,
  })
  const tag: Accessor<ValidComponent> = () => local.as ?? 'button'
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
      element: context.triggerElement,
      onPress: context.toggle,
      tag,
    },
    rest,
  )
  const children = resolveChildren(() => local.children)

  return (
    <Dynamic
      id={context.triggerId()}
      data-slot="collapsible-trigger"
      {...interactionProps}
      component={tag()}
      {...resolved.styles.trigger}
      aria-controls={context.open() ? context.contentId() : undefined}
      aria-expanded={context.open()}
      {...collapsibleDataAttributes.trigger({
        expanded: () => context.dataAttrs()['data-expanded'],
        closed: () => context.dataAttrs()['data-closed'],
        disabled,
      })}
      ref={handleRef}
    >
      {children()}
    </Dynamic>
  )
}
