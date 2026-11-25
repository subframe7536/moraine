import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { pick } from '../../shared/utils'

import { useCollapsibleContext } from './collapsible-context'
import { collapsibleDataAttributes, collapsibleRecipe } from './collapsible.recipe'
import type { CollapsibleT } from './collapsible.types'
/**
 * Button inside `Collapsible` that toggles its content and exposes `aria-expanded` and
 * `aria-controls`. Place it inside `Collapsible`; it renders a `button` by default (an `a` when
 * `href` is given), or pass `as` to render another element or component. `disabled` blocks only
 * this trigger.
 *
 * @example
 * ```tsx
 * import { Collapsible } from 'moraine'
 *
 * <Collapsible>
 *   <Collapsible.Trigger>Details</Collapsible.Trigger>
 *   <Collapsible.Content>More information</Collapsible.Content>
 * </Collapsible>
 * ```
 */
export function CollapsibleTrigger<T extends ValidComponent = 'button'>(
  props: CollapsibleT.TriggerProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'disabled', 'class', 'style', 'ref' as any)
  const rest = omit(props, 'as', 'disabled', 'class', 'style', 'ref' as any)
  const context = useCollapsibleContext()
  if (!context) {
    throw new Error('Collapsible.Trigger must be used within Collapsible')
  }
  const disclosure = context.disclosure
  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(collapsibleRecipe, local, {
    slot: 'trigger',
    data: {
      trigger: collapsibleDataAttributes.trigger(() => ({
        expanded: disclosure.open,
        closed: disclosure.closed,
        disabled,
      })),
    },
    context: () => context.slotOverrides,
  })
  const tag: Accessor<ValidComponent> = () =>
    local.as ?? ((rest as any).href !== undefined && (rest as any).href !== null ? 'a' : 'button')
  const disabled = () => Boolean(disclosure.disabled() || local.disabled)

  const root = createPolymorphicRoot({
    tag,
    ref: () => local.ref,
    registration: {
      element: disclosure.triggerElement,
      setElement: disclosure.setTriggerElement,
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
  const Root = dynamic(tag)
  return (
    <Root
      data-slot="collapsible-trigger"
      aria-controls={context.contentId()}
      aria-expanded={disclosure.open() ? 'true' : 'false'}
      {...binding}
      {...triggerSlot}
      id={context.triggerId()}
    />
  )
}
