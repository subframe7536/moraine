import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

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
  const handledEvents = new WeakSet<Event>()
  const forwardEvent = (
    key: 'onClick' | 'onKeyDown' | 'onKeyUp' | 'onPointerDown' | 'onBlur',
    event: Event,
  ): void => {
    if (handledEvents.has(event)) {
      return
    }
    handledEvents.add(event)
    callHandler(event, interactionProps[key])
  }
  const setTriggerRef = (element: HTMLElement | undefined) => {
    context.setTriggerElement(element)
    callRef(local.ref, element)

    if (element) {
      const eventKeys = {
        click: 'onClick',
        keydown: 'onKeyDown',
        keyup: 'onKeyUp',
        pointerdown: 'onPointerDown',
        blur: 'onBlur',
      } as const
      const releases = Object.entries(eventKeys).map(([name, key]) =>
        attachEventListener(element, name as keyof HTMLElementEventMap, (event) =>
          forwardEvent(key, event),
        ),
      )
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
      {...interactionProps}
      onClick={(event: MouseEvent) => forwardEvent('onClick', event)}
      onKeyDown={(event: KeyboardEvent) => forwardEvent('onKeyDown', event)}
      onKeyUp={(event: KeyboardEvent) => forwardEvent('onKeyUp', event)}
      onPointerDown={(event: PointerEvent) => forwardEvent('onPointerDown', event)}
      onBlur={(event: FocusEvent) => forwardEvent('onBlur', event)}
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
