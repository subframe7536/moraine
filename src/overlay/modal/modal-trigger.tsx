import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, onMount, splitProps } from 'solid-js'
import { Dynamic, delegateEvents } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { attachEventListener } from '../../shared/use-event-listener'
import { callHandler, callRef } from '../../shared/utils'
import { validateOverlayTrigger } from '../base/trigger'
import { overlayTriggerDataAttributes } from '../base/trigger.recipe'

import { useModalContext } from './modal-context'
import type { ModalT } from './modal.types'

/** Interactive modal trigger with Button-compatible polymorphic behavior. */
export function ModalTrigger<T extends ValidComponent = 'button'>(
  props: ModalT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'disabled',
    'children',
    'class',
    'style',
    'ref' as any,
  ])
  const context = useModalContext()
  const tag = createMemo(() => local.as ?? 'button')
  const disabled = () => Boolean(local.disabled)
  const interactionProps = useButtonInteraction(
    {
      disabled,
      disabledForComponent: true,
      element: context.triggerElement,
      onPress: () => context.updateOpen(true),
      tag,
    },
    rest,
  )
  const children = resolveChildren(() => local.children)
  const [, triggerAttributes] = splitProps(interactionProps, ['onClick'])
  const setTriggerRef = (element: HTMLElement | undefined) => {
    context.setTriggerElement(element)
    callRef(local.ref, element)

    if (element) {
      // Let a custom root cancel the click before handling it on the document.
      if (typeof tag() === 'function') {
        delegateEvents(['click'], document)
      }
      const releases = (['onClick', 'onKeyDown', 'onKeyUp', 'onPointerDown'] as const).map((key) =>
        attachEventListener(
          element,
          key.slice(2).toLowerCase() as keyof HTMLElementEventMap,
          (event) => {
            if (element.ownerDocument !== document) {
              ;(interactionProps[key] as EventListener)(event)
            }
          },
        ),
      )
      if (typeof tag() === 'function') {
        releases.push(
          attachEventListener(document, 'click', (event) => {
            if (event.target instanceof Node && element.contains(event.target)) {
              callHandler(event, interactionProps.onClick)
            }
          }),
        )
      }
      onCleanup(() => {
        releases.forEach((release) => release())
        if (context.triggerElement() === element) {
          context.setTriggerElement(undefined)
        }
        callRef(local.ref, undefined)
      })
    }
  }

  onMount(() => {
    validateOverlayTrigger(context.triggerElement(), 'Modal')
  })

  return (
    <Dynamic
      data-slot={context.slotName('trigger')}
      {...triggerAttributes}
      onClick={typeof tag() === 'function' ? undefined : interactionProps.onClick}
      component={tag()}
      style={local.style}
      class={local.class}
      aria-haspopup="dialog"
      aria-controls={context.contentElement() ? context.contentId() : undefined}
      aria-expanded={context.open() ? 'true' : 'false'}
      {...overlayTriggerDataAttributes({
        expanded: context.open,
        closed: () => !context.open(),
        disabled,
      })}
      ref={setTriggerRef}
    >
      {children()}
    </Dynamic>
  )
}
