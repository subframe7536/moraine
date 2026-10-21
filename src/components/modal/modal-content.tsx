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

/** Standalone Modal content surface. */
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
  const { slots } = useRecipe(modalRecipe, local, {
    slot: 'content',
    contextSlots: () => context.slotOverrides,
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
      {...modalDataAttributes.content({
        expanded: context.open,
        closed: () => !context.open(),
      })}
      {...rest}
      {...slots.content}
      ref={binding.ref}
      onKeyDown={binding.onKeyDown}
    >
      {body()}
    </Dynamic>
  )
}
