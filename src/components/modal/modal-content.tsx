import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'

import { createModalContentBinding } from './modal-content-binding'
import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

/**
 * Surface of a `Modal` that holds the modal's content and carries the `dialog` role. Place it
 * inside `Modal.Portal`, next to `Modal.Overlay`; one `Modal` root owns one active content. Give
 * it an accessible name with `aria-label` or `aria-labelledby`. Children can be JSX or a function
 * that receives `close`. Renders a `div`; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, Modal } from 'moraine'
 *
 * <Modal>
 *   <Modal.Trigger as={Button}>Open</Modal.Trigger>
 *   <Modal.Portal>
 *     <Modal.Overlay />
 *     <Modal.Content aria-label="Custom surface">
 *       {(context) => <Button onClick={context.close}>Close</Button>}
 *     </Modal.Content>
 *   </Modal.Portal>
 * </Modal>
 * ```
 */
export function ModalContent<T extends ValidComponent = 'div'>(
  props: ModalT.ContentProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as ModalT.ContentProps<T> & { ref?: unknown }, [
    'as',
    'ref',
    'children',
    'class',
    'style',
  ])
  const context = useModalContext()
  const binding = createModalContentBinding(context, {
    ref: () => local.ref,
    onKeyDown: () =>
      rest.onKeyDown as JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined,
  })
  const {
    slots: { content: contentSlot },
  } = useRecipe(modalRecipe, local, {
    slot: 'content',
    data: {
      content: modalDataAttributes.content({
        expanded: context.open,
        closed: () => !context.open(),
        transition: context.transition,
      }),
    },
    context: () => context.slotOverrides,
  })

  const child = resolveChildren(() => local.children)
  const body = createMemo(() =>
    renderWithProps(child(), {
      close: () => context.updateOpen(false),
    }),
  )

  const tag = (): ValidComponent => local.as ?? 'div'

  return (
    <Dynamic
      component={tag()}
      data-slot="modal-content"
      role="dialog"
      id={context.contentId()}
      tabIndex={binding.tabIndex}
      aria-modal={binding.ariaModal()}
      {...contentSlot}
      {...rest}
      ref={binding.ref}
      onKeyDown={binding.onKeyDown}
    >
      {body()}
    </Dynamic>
  )
}
