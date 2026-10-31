import type { JSX } from 'solid-js'
import { Show, createEffect, on, onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { callRef } from '../../shared/utils'

import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

/** Backdrop layer for modal dialogs. */
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
      }),
    },
    context: () => context.slotOverrides,
  })

  createEffect(on(() => Boolean(local.scrollable && isOverlay()), context.setOverlayScroll))
  onCleanup(() => context.setOverlayScroll(false))

  const hasChildren = () => local.children !== undefined

  return (
    <Show when={isOverlay() || hasChildren()} fallback={null}>
      <div
        data-slot={isOverlay() ? 'modal-overlay' : undefined}
        {...(isOverlay() ? overlaySlot : undefined)}
        {...rest}
        ref={(element) => {
          let unregister: (() => void) | undefined
          if (isOverlay()) {
            unregister = presence.registerElement(element)
          }
          callRef(local.ref, element)
          onCleanup(() => {
            unregister?.()
          })
        }}
      >
        {local.children}
      </div>
    </Show>
  )
}
