import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef } from '../../shared/utils'
import { containFocusInContainer } from '../base/utils'

import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

/** Standalone Modal content surface; composed overlays reuse this component. */
export function ModalContent(props: ModalT.ContentProps): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'ref',
    'children',
    'ariaLabel',
    'ariaLabelledBy',
    'ariaDescribedBy',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'class',
    'style',
    'role',
    'onKeyDown',
  ])
  const context = useModalContext()
  const presence = context.presence
  const isModalRoot = context.configuration.kind === 'modal'
  const { slots } = useRecipe(modalRecipe, local, {
    slot: 'content',
    contextSlots: () => (isModalRoot ? context.slotOverrides : undefined),
  })

  const child = resolveChildren(() => local.children as JSX.Element)
  const body = createMemo(() =>
    renderWithProps(child(), {
      close: () => context.updateOpen(false),
    }),
  )

  return (
    <div
      data-slot={context.slotName('content')}
      {...modalDataAttributes.content({
        expanded: context.open,
        closed: () => !context.open(),
      })}
      {...rest}
      ref={(element) => {
        const unregister = presence.registerElement(element)
        context.setContentElement(element)
        callRef(local.ref, element)
        onCleanup(() => {
          unregister()
          if (context.contentElement() === element) {
            context.setContentElement(undefined)
          }
        })
      }}
      id={context.contentId()}
      role={local.role ?? 'dialog'}
      aria-modal={context.isModal() ? 'true' : undefined}
      aria-label={local['aria-label'] ?? local.ariaLabel}
      aria-labelledby={local['aria-labelledby'] ?? local.ariaLabelledBy}
      aria-describedby={local['aria-describedby'] ?? local.ariaDescribedBy}
      tabIndex={-1}
      {...(isModalRoot
        ? slots.content
        : {
            class: cn(local.class),
            style: local.style,
          })}
      onKeyDown={(event) => {
        callHandler(event, local.onKeyDown)
        if (event.defaultPrevented) {
          return
        }
        if (context.isModal()) {
          containFocusInContainer(event, context.contentElement())
        }
      }}
    >
      {body()}
    </div>
  )
}
