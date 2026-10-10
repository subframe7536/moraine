import type { JSX } from 'solid-js'
import { Show, createEffect, on, onCleanup, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { callRef } from '../../shared/utils'

import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

/** Backdrop layer for modal dialogs. */
export function ModalOverlay(props: ModalT.OverlayProps): JSX.Element {
  const cn = useCn()
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
  const isModalRoot = context.configuration.kind === 'modal'
  const resolved = isModalRoot
    ? createStyles(modalRecipe, local, {
        rootSlot: 'overlay',
        inheritedStyles: () => context.presentation,
      })
    : undefined

  createEffect(on(() => Boolean(local.scrollable && isOverlay()), context.setOverlayScroll))
  onCleanup(() => context.setOverlayScroll(false))

  const hasChildren = () => local.children !== undefined

  return (
    <Show when={isOverlay() || hasChildren()} fallback={null}>
      <div
        data-slot={isOverlay() ? context.slotName('overlay') : undefined}
        {...(isOverlay()
          ? modalDataAttributes.overlay({
              overlayScroll: () => local.scrollable,
              expanded: context.open,
              closed: () => !context.open(),
            })
          : {})}
        {...rest}
        ref={(element) => {
          let unregister: (() => void) | undefined
          if (isOverlay()) {
            unregister = presence.registerElement(element)
          }
          callRef(local.ref, element)
          onCleanup(() => {
            unregister?.()
            callRef(local.ref, undefined)
          })
        }}
        class={
          isOverlay() ? (isModalRoot ? resolved!.styles.overlay.class : cn(local.class)) : undefined
        }
        style={
          isOverlay() ? (isModalRoot ? resolved!.styles.overlay.style : local.style) : undefined
        }
      >
        {local.children}
      </div>
    </Show>
  )
}
