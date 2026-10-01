import type { Accessor, JSX } from 'solid-js'
import { children as resolveChildren, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'

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

  const root = createPolymorphicRoot({
    tag,
    ref: () => local.ref,
    registration: { element: context.triggerElement, ref: context.setTriggerElement },
  })

  const interactionProps = useButtonInteraction(
    {
      disabled,
      disabledForComponent: true,
      element: root.element,
      onPress: context.toggle,
      tag,
    },
    rest,
  )
  const binding = root.bind(interactionProps)
  const children = resolveChildren(() => local.children)

  return (
    <Dynamic
      id={context.triggerId()}
      data-slot="collapsible-trigger"
      {...binding}
      component={tag()}
      {...resolved.styles.trigger}
      aria-controls={context.contentId()}
      aria-expanded={context.open()}
      {...collapsibleDataAttributes.trigger({
        expanded: () => context.dataAttrs()['data-expanded'],
        closed: () => context.dataAttrs()['data-closed'],
        disabled,
      })}
    >
      {children()}
    </Dynamic>
  )
}
