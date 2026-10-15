import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'

import { createModalContentBinding } from './modal-content-binding'
import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

/** Standalone Modal content surface. */
export function ModalContent(props: ModalT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ref',
    'children',
    'class',
    'style',
    'role',
    'onKeyDown',
  ])
  const context = useModalContext()
  const binding = createModalContentBinding(context, {
    ref: () => local.ref,
    onKeyDown: () => local.onKeyDown,
  })
  const { slots } = useRecipe(modalRecipe, local, {
    slot: 'content',
    contextSlots: () => context.slotOverrides,
  })

  const child = resolveChildren(() => local.children as JSX.Element)
  const body = createMemo(() =>
    renderWithProps(child(), {
      close: () => context.updateOpen(false),
    }),
  )

  return (
    <div
      data-slot="modal-content"
      role={local.role ?? 'dialog'}
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
    </div>
  )
}
