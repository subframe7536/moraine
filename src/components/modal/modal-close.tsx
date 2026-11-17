import type { Accessor, JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'

import { useModalContext } from './modal-context'
import type { ModalT } from './modal.types'

/**
 * Control that closes the surrounding `Modal`. Place it anywhere inside the `Modal` root, usually
 * within `Modal.Content`. Renders a `button`; pass `as` to render another component such as
 * `Button`.
 *
 * @example
 * ```tsx
 * import { Button, Modal } from 'moraine'
 *
 * <Modal>
 *   <Modal.Trigger as={Button}>Open</Modal.Trigger>
 *   <Modal.Portal>
 *     <Modal.Overlay />
 *     <Modal.Content aria-label="Details">
 *       <Modal.Close as={Button}>Close</Modal.Close>
 *     </Modal.Content>
 *   </Modal.Portal>
 * </Modal>
 * ```
 */
export function ModalClose<T extends ValidComponent = 'button'>(
  props: ModalT.CloseProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'disabled', 'ref' as any])
  const context = useModalContext()
  const tag: Accessor<ValidComponent> = () => local.as ?? 'button'
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })
  const interaction = useButtonInteraction(
    {
      disabled: () => Boolean(local.disabled),
      disabledForComponent: true,
      element: root.element,
      onPress: () => context.updateOpen(false),
      tag,
    },
    rest,
  )
  const binding = root.bind(interaction)

  return <Dynamic component={tag()} data-slot="modal-close" {...binding} />
}
