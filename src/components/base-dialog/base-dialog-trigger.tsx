import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { onSettled, omit } from 'solid-js'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { pick } from '../../shared/utils'
import { validateOverlayTrigger } from '../shared/overlay/trigger'
import { overlayTriggerDataAttributes } from '../shared/overlay/trigger.recipe'

import { useBaseDialogContext } from './base-dialog-context'
import type { BaseDialogT } from './base-dialog.types'
/**
 * Element that opens the surrounding `BaseDialog`; when `modal` is `false` it toggles the open state
 * instead. Renders a `button`; pass `as` to render another component such as `Button`.
 *
 * @example
 * ```tsx
 * import { Button, BaseDialog } from 'moraine'
 *
 * <BaseDialog>
 *   <BaseDialog.Trigger as={Button}>Open</BaseDialog.Trigger>
 *   <BaseDialog.Portal>
 *     <BaseDialog.Content aria-label="Details">Modal content</BaseDialog.Content>
 *   </BaseDialog.Portal>
 * </BaseDialog>
 * ```
 */
export function BaseDialogTrigger<T extends ValidComponent = 'button'>(
  props: BaseDialogT.TriggerProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'disabled', 'ref' as any)
  const rest = omit(props, 'as', 'disabled', 'ref' as any)
  const context = useBaseDialogContext()
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({
    tag,
    bridgeClick: true,
    ref: () => local.ref,
    registration: { element: context.triggerElement, setElement: context.setTriggerElement },
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

  onSettled(() => {
    queueMicrotask(() => validateOverlayTrigger(context.triggerElement(), 'BaseDialog'))
  })

  return (
    <Dynamic
      component={tag()}
      data-slot="base-dialog-trigger"
      aria-haspopup="dialog"
      aria-controls={
        context.contentElement() ? context.contentElement()?.id || context.contentId() : undefined
      }
      aria-expanded={context.open() ? 'true' : 'false'}
      // oxlint-disable-next-line moraine/data-attributes-in-slot-binding -- The trigger has no recipe slot to carry its data.
      {...overlayTriggerDataAttributes({
        expanded: context.open,
        closed: () => !context.open(),
        disabled,
      })}
      {...binding}
    />
  )
}
