import type { JSX } from 'solid-js'
import { Show, createEffect, createSignal, on, onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { bindElement } from '../../shared/element-binding'
import { callRef } from '../../shared/utils'

import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

/**
 * Backdrop layer of a `Modal`. Place it inside `Modal.Portal` before `Modal.Content`; omit it when
 * the host surface already provides context. Renders a `div`; set `overlay={false}` to render an
 * unstyled container for its children instead of the backdrop.
 *
 * @example
 * ```tsx
 * import { Button, Modal } from 'moraine'
 *
 * <Modal>
 *   <Modal.Trigger as={Button}>Open</Modal.Trigger>
 *   <Modal.Portal>
 *     <Modal.Overlay />
 *     <Modal.Content aria-label="Details">Modal content</Modal.Content>
 *   </Modal.Portal>
 * </Modal>
 * ```
 */
export function ModalOverlay(props: ModalT.OverlayProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'class',
    'style',
    'ref',
    'children',
    'scrollable',
    'overlay',
  ])

  const context = useModalContext()
  const presence = context.presence
  const isOverlay = () => local.overlay !== false
  const {
    slots: { overlay: overlaySlot },
  } = useRecipe(modalRecipe, local, {
    slot: 'overlay',
    data: {
      overlay: modalDataAttributes.overlay({
        overlayScroll: () => local.scrollable,
        expanded: context.open,
        closed: () => !context.open(),
        transition: context.transition,
      }),
    },
    context: () => context.slotOverrides,
  })

  createEffect(on(() => Boolean(local.scrollable && isOverlay()), context.setOverlayScroll))
  onCleanup(() => context.setOverlayScroll(false))

  const hasChildren = () => local.children !== undefined

  return (
    <Show when={isOverlay() || hasChildren()} fallback={null}>
      {(_visible) => {
        const [element, setElement] = createSignal<HTMLDivElement>()
        // Only the backdrop element animates as part of the presence; a plain wrapper does not.
        bindElement(() => isOverlay() && element(), presence.registerElement)
        return (
          <div
            data-slot={isOverlay() ? 'modal-overlay' : undefined}
            {...(isOverlay() ? overlaySlot : undefined)}
            {...rest}
            ref={(element) => {
              setElement(element)
              callRef(local.ref, element)
            }}
          >
            {local.children}
          </div>
        )
      }}
    </Show>
  )
}
