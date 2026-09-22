import type { JSX } from 'solid-js'
import { Show, onCleanup, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { createStyles } from '../../provider'
import { createContextProvider } from '../../shared/create-context-provider'
import { callRef } from '../../shared/utils'

import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

export const [ModalOverlayProvider, useModalOverlayContext] = createContextProvider<boolean>(
  'ModalOverlay',
  false,
)

/** Backdrop layer for modal dialogs. */
export function ModalOverlay(props: ModalT.OverlayProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class', 'style', 'ref', 'children', 'scrollable'])

  const context = useModalContext()
  const presence = context.presence
  const resolved = createStyles(modalRecipe, local, {
    rootSlot: 'overlay',
    inheritedStyles: () => context.presentation,
  })

  return (
    <Show when={presence.present()}>
      {(_present) => (
        <Portal mount={context.triggerElement()?.ownerDocument.body}>
          <div
            {...rest}
            data-slot="overlay"
            {...modalDataAttributes.overlay({
              'overlay-scroll': () => local.scrollable,
              expanded: () => presence.dataAttrs()['data-expanded'],
              closed: () => presence.dataAttrs()['data-closed'],
            })}
            ref={(element) => {
              const unregister = presence.registerElement(element)
              callRef(local.ref, element)
              onCleanup(() => {
                unregister()
                callRef(local.ref, undefined)
              })
            }}
            {...resolved.styles.overlay}
          >
            <ModalOverlayProvider value={true}>{local.children}</ModalOverlayProvider>
          </div>
        </Portal>
      )}
    </Show>
  )
}
