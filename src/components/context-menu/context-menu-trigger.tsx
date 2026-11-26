import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { merge, onSettled, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'
import {
  getContextMenuTriggerAccessibility,
  validateOverlayTrigger,
} from '../shared/overlay/trigger'

import { useContextMenuContext } from './context-menu-context'
import {
  CONTEXT_MENU_TRIGGER_CLASS,
  contextMenuDataAttributes,
  contextMenuRecipe,
} from './context-menu.recipe'
import type { ContextMenuT } from './context-menu.types'
/**
 * Surface that opens the surrounding `ContextMenu` from a context-menu gesture, the keyboard
 * context-menu keys, or a touch or pen long press. Place it inside `ContextMenu`; it renders a
 * `div` by default, so pass `as` to use another element, and `disabled` prevents opening.
 *
 * @example
 * ```tsx
 * import { ContextMenu } from 'moraine'
 *
 * <ContextMenu>
 *   <ContextMenu.Trigger class="flex h-32 items-center justify-center">
 *     Right-click or long-press inside this area
 *   </ContextMenu.Trigger>
 *   <ContextMenu.Content items={[{ label: 'Reload' }]} />
 * </ContextMenu>
 * ```
 */
export function ContextMenuTrigger<T extends ValidComponent = 'div'>(
  props: ContextMenuT.TriggerProps<T>,
): JSX.Element {
  const rest = omit(props, 'as', 'class', 'style', 'disabled')
  const context = useContextMenuContext()

  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(contextMenuRecipe, props, {
    slot: 'trigger',
    data: {
      trigger: contextMenuDataAttributes.trigger(() => ({
        closed: () => !context.isOpen(),
        disabled,
        expanded: context.isOpen,
      })),
    },
    context: () => context.slotOverrides,
    own: { trigger: () => ({ class: CONTEXT_MENU_TRIGGER_CLASS }) },
  })
  const tag = () => props.as ?? 'div'
  const root = createPolymorphicRoot({
    tag,
    ref: () => rest.ref,
    registration: { element: context.triggerElement, setElement: context.setTriggerElement },
  })
  const disabled = () => props.disabled ?? context.disabled()
  const a11y = () => getContextMenuTriggerAccessibility(context.triggerElement(), disabled())
  const userEvents = rest as Record<string, unknown>
  const dispatchTriggerEvent = (
    key:
      | 'onClick'
      | 'onKeyDown'
      | 'onContextMenu'
      | 'onPointerDown'
      | 'onPointerMove'
      | 'onPointerUp'
      | 'onPointerCancel',
    event: Event,
  ) => {
    callHandler(event, userEvents[key])
    if (disabled()) {
      event.preventDefault()
    }
    callHandler(event, context.triggerProps[key])
  }
  const events = {
    onClick: (event: Event) => dispatchTriggerEvent('onClick', event),
    onKeyDown: (event: Event) => dispatchTriggerEvent('onKeyDown', event),
    onContextMenu: (event: Event) => dispatchTriggerEvent('onContextMenu', event),
    onPointerDown: (event: Event) => dispatchTriggerEvent('onPointerDown', event),
    onPointerMove: (event: Event) => dispatchTriggerEvent('onPointerMove', event),
    onPointerUp: (event: Event) => dispatchTriggerEvent('onPointerUp', event),
    onPointerCancel: (event: Event) => dispatchTriggerEvent('onPointerCancel', event),
  }
  const triggerProps = merge(
    { 'data-slot': 'context-menu-trigger' },
    context.triggerProps,
    triggerSlot,
    {
      get disabled() {
        return a11y().disabled
      },
      get 'aria-disabled'() {
        return a11y().ariaDisabled
      },
      get tabindex() {
        return a11y().tabIndex
      },
    },
    rest,
    events,
  )
  const binding = root.bind(triggerProps)
  onSettled(() => {
    let active = true
    queueMicrotask(() => {
      if (active) {
        validateOverlayTrigger(root.element(), 'ContextMenu')
      }
    })
    return () => {
      active = false
    }
  })
  const Root = dynamic<ValidComponent>(tag)
  return <Root type={undefined} {...(binding as Record<string, unknown>)} />
}
