import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { bindElement } from '../../shared/element-binding'
import { callRef } from '../../shared/utils'

import { useBaseDialogContext } from './base-dialog-context'
import { baseDialogDataAttributes, baseDialogRecipe } from './base-dialog.recipe'
import type { BaseDialogT } from './base-dialog.types'

/**
 * Backdrop layer of a `BaseDialog`. Place it inside `BaseDialog.Portal` before `BaseDialog.Content`; omit it when
 * the host surface already provides context. Renders a `div`; set `scrollable` to let it scroll
 * content taller than the viewport.
 *
 * @example
 * ```tsx
 * import { Button, BaseDialog } from 'moraine'
 *
 * <BaseDialog>
 *   <BaseDialog.Trigger as={Button}>Open</BaseDialog.Trigger>
 *   <BaseDialog.Portal>
 *     <BaseDialog.Overlay />
 *     <BaseDialog.Content aria-label="Details">Modal content</BaseDialog.Content>
 *   </BaseDialog.Portal>
 * </BaseDialog>
 * ```
 */
export function BaseDialogOverlay(props: BaseDialogT.OverlayProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class', 'style', 'ref', 'children', 'scrollable'])

  const context = useBaseDialogContext()
  const {
    slots: { overlay: overlaySlot },
  } = useRecipe(baseDialogRecipe, local, {
    slot: 'overlay',
    data: {
      overlay: baseDialogDataAttributes.overlay({
        overlayScroll: () => local.scrollable,
        expanded: context.open,
        closed: () => !context.open(),
        transition: context.transition,
      }),
    },
    context: () => context.slotOverrides,
  })

  const [element, setElement] = createSignal<HTMLDivElement>()
  bindElement(element, context.presence.registerElement)

  createEffect(on(() => Boolean(local.scrollable), context.setOverlayScroll))
  onCleanup(() => context.setOverlayScroll(false))

  return (
    <div
      data-slot="base-dialog-overlay"
      {...overlaySlot}
      {...rest}
      ref={(element) => {
        setElement(element)
        callRef(local.ref, element)
      }}
    >
      {local.children}
    </div>
  )
}
