import type { JSX } from 'solid-js'
import { mergeProps, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

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

export function ContextMenuTrigger<T extends ValidComponent = 'div'>(
  props: ContextMenuT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'disabled'])
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
    registration: { element: context.triggerElement, ref: context.triggerProps.ref },
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
    // oxlint-disable-next-line subf/solid-reactivity -- Event handler reads reactive disabled state.
    events[key] = function onEvent(event) {
      callHandler(event, userEvents[key])
      if (disabled()) {
        event.preventDefault()
      }
      callHandler(event, context.triggerProps[key])
    }
  }
  const triggerProps = mergeProps(
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
  onMount(() => validateOverlayTrigger(context.triggerElement(), 'ContextMenu'))
  return <Dynamic component={tag()} type={undefined} {...binding} />
}
