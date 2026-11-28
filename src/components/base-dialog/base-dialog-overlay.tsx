import type { JSX } from '@solidjs/web'
import { createEffect, createSignal, omit } from 'solid-js'

import { useRecipe } from '../../provider'
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
  const rest = omit(props, 'class', 'style', 'ref', 'children', 'scrollable')

  const context = useBaseDialogContext()
  const {
    slots: { overlay: overlaySlot },
  } = useRecipe(baseDialogRecipe, props, {
    slot: 'overlay',
    data: {
      overlay: baseDialogDataAttributes.overlay({
        overlayScroll: () => props.scrollable,
        expanded: context.open,
        closed: () => !context.open(),
        transition: context.transition,
      }),
    },
    context: () => context.slotOverrides,
  })

  const [element, setElement] = createSignal<HTMLDivElement>()
  createEffect(element, (node) => {
    if (!node) {
      return
    }
    return context.presence.registerElement(node)
  })

  createEffect(
    () => Boolean(props.scrollable),
    (scrollable) => {
      context.setOverlayScroll(scrollable)
      return () => context.setOverlayScroll(false)
    },
  )

  return (
    <div
      data-slot="base-dialog-overlay"
      {...overlaySlot}
      {...rest}
      ref={(element) => {
        setElement(element)
        callRef(() => props.ref, element)
      }}
    >
      {props.children}
    </div>
  )
}
