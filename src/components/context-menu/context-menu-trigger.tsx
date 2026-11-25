import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { flush, merge, onSettled, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { callHandler, pick } from '../../shared/utils'
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
  const local = pick(props, 'as', 'class', 'style', 'disabled')
  const rest = omit(props, 'as', 'class', 'style', 'disabled')
  const context = useContextMenuContext()

  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(contextMenuRecipe, local, {
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
  const tag = () => local.as ?? 'div'
  const root = createPolymorphicRoot({
    tag,
    ref: () => rest.ref,
    registration: { element: context.triggerElement, setElement: context.setTriggerElement },
  })
  const disabled = () => Boolean(local.disabled ?? context.disabled())
  const a11y = () => getContextMenuTriggerAccessibility(context.triggerElement(), disabled())
  const userEvents = rest as Record<string, unknown>
  const events: Record<string, (event: Event) => void> = {}
  for (const key of [
    'onClick',
    'onKeyDown',
    'onContextMenu',
    'onPointerDown',
    'onPointerMove',
    'onPointerUp',
    'onPointerCancel',
  ] as const) {
    events[key] = function onEvent(event) {
      callHandler(event, userEvents[key])
      if (disabled()) {
        event.preventDefault()
      }
      callHandler(event, context.triggerProps[key])
    }
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
      get tabIndex() {
        return a11y().tabIndex
      },
    },
    rest,
    events,
  )
  const binding = root.bind(triggerProps)
  onSettled(() =>
    queueMicrotask(() => {
      flush()
      validateOverlayTrigger(root.element(), 'ContextMenu')
    }),
  )
  const Root = dynamic<ValidComponent>(tag)
  return <Root type={undefined} {...(binding as Record<string, unknown>)} />
}
