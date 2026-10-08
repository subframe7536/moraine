import type { JSX } from 'solid-js'
import { children as resolveChildren, mergeProps, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'
import { getContextMenuTriggerAccessibility, validateOverlayTrigger } from '../base/trigger'

import { useContextMenuContext } from './context-menu-context'
import { contextMenuDataAttributes, contextMenuRecipe } from './context-menu.recipe'
import type { ContextMenuT } from './context-menu.types'

export function ContextMenuTrigger<T extends ValidComponent = 'div'>(
  props: ContextMenuT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'children', 'class', 'style', 'disabled'])
  const context = useContextMenuContext()

  const resolved = createStyles(contextMenuRecipe, local, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.presentation,
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
  const triggerDataAttrs = contextMenuDataAttributes.trigger({
    closed: () => !context.isOpen(),
    disabled,
    expanded: context.isOpen,
  })
  const triggerProps = mergeProps(
    context.triggerProps,
    triggerDataAttrs,
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
  const children = resolveChildren(() => local.children)
  onMount(() => validateOverlayTrigger(context.triggerElement(), 'ContextMenu'))
  return (
    <Dynamic
      component={tag()}
      type={undefined}
      {...binding}
      data-slot="context-menu-trigger"
      {...resolved.styles.trigger}
    >
      {children()}
    </Dynamic>
  )
}
