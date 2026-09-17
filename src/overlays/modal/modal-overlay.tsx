import type { JSX } from 'solid-js'
import { Show, onCleanup, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider'
import { createStyles } from '../../shared/provider'
import { callRef } from '../../shared/utils'

import { useModalContext } from './modal-context'
import { modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

export const [ModalOverlayProvider, useModalOverlayContext] = createContextProvider<boolean>(
  'ModalOverlay',
  false,
)

/** Backdrop layer for modal dialogs. */
export function ModalOverlay(props: ModalT.OverlayProps): JSX.Element {
  type RuntimeProps = ModalT.OverlayBase & {
    class?: ModalT.Classes['overlay']
    style?: JSX.CSSProperties
    classes?: Partial<ModalT.Classes>
    styles?: Partial<ModalT.Styles>
    ref?: (element: HTMLDivElement | undefined) => void
  } & Record<string, unknown>

  const [local, rest] = splitProps(props as RuntimeProps, [
    'class',
    'style',
    'classes',
    'styles',
    'ref',
    'children',
    'scrollable',
  ])

  const context = useModalContext()
  const presence = context.presence
  const resolved = createStyles(modalRecipe, local, { rootSlot: 'overlay' })

  return (
    <Show when={presence.present()}>
      {(_present) => (
        <Portal>
          <div
            {...rest}
            data-slot="overlay"
            data-overlay-scroll={local.scrollable ? '' : undefined}
            {...presence.dataAttrs()}
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
