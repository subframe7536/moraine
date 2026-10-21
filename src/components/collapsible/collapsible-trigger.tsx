import type { Accessor, JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
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
  const [local, rest] = splitProps(props, ['as', 'disabled', 'class', 'style', 'ref' as any])
  const context = useCollapsibleContext()
  if (!context) {
    throw new Error('Collapsible.Trigger must be used within Collapsible')
  }
  const disclosure = context.disclosure
  const { slots } = useRecipe(collapsibleRecipe, local, {
    slot: 'trigger',
    contextSlots: () => context.slotOverrides,
  })
  const tag: Accessor<ValidComponent> = () =>
    local.as ?? ((rest as any).href !== undefined && (rest as any).href !== null ? 'a' : 'button')
  const disabled = () => Boolean(disclosure.disabled() || local.disabled)

  const root = createPolymorphicRoot({
    tag,
    ref: () => local.ref,
    registration: {
      element: disclosure.triggerElement,
      ref: disclosure.setTriggerElement,
    },
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

  return (
    <Dynamic
      component={tag()}
      data-slot="collapsible-trigger"
      aria-controls={context.contentId()}
      aria-expanded={disclosure.open()}
      {...collapsibleDataAttributes.trigger({
        expanded: disclosure.open,
        closed: disclosure.closed,
        disabled,
      })}
      {...binding}
      id={context.triggerId()}
      {...slots.trigger}
    />
  )
}
