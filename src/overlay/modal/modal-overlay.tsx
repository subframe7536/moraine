import type { JSX } from 'solid-js'
import { Show, onCleanup, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { callRef } from '../../shared/utils'

import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

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
        <div
          {...rest}
          data-slot={context.slotName('overlay')}
          {...modalDataAttributes.overlay({
            overlayScroll: () => local.scrollable,
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
          {local.children}
        </div>
      )}
    </Show>
  )
}
