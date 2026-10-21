import type { JSX } from 'solid-js'
import { onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { validateOverlayTrigger } from '../shared/overlay/trigger'
import { overlayTriggerDataAttributes } from '../shared/overlay/trigger.recipe'

import { useModalContext } from './modal-context'
import type { ModalT } from './modal.types'

/** Interactive modal trigger with Button-compatible polymorphic behavior. */
export function ModalTrigger<T extends ValidComponent = 'button'>(
  props: ModalT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'disabled', 'ref' as any])
  const context = useModalContext()
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({
    tag,
    bridgeClick: true,
    ref: () => local.ref,
    registration: { element: context.triggerElement, ref: context.setTriggerElement },
  })
  const disabled = () => Boolean(local.disabled)
  const interactionProps = useButtonInteraction(
    {
      disabled,
      disabledForComponent: true,
      element: root.element,
      onPress: () => {
        if (!context.isModal()) {
          context.updateOpen(!context.open())
        } else {
          context.updateOpen(true)
        }
      },
      tag,
    },
    rest,
  )
  const binding = root.bind(interactionProps)

  onMount(() => {
    validateOverlayTrigger(context.triggerElement(), 'Modal')
  })

  return (
    <Dynamic
      component={tag()}
      data-slot="modal-trigger"
      aria-haspopup="dialog"
      aria-controls={
        context.contentElement() ? context.contentElement()?.id || context.contentId() : undefined
      }
      aria-expanded={context.open() ? 'true' : 'false'}
      {...overlayTriggerDataAttributes({
        expanded: context.open,
        closed: () => !context.open(),
        disabled,
      })}
      {...binding}
    />
  )
}
