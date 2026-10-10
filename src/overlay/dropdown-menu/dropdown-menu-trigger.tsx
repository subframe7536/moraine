import type { JSX } from 'solid-js'
import { children as resolveChildren, mergeProps, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler } from '../../shared/utils'
import { validateOverlayTrigger } from '../base/trigger'

import { useDropdownMenuContext } from './dropdown-menu-context'
import { dropdownMenuRecipe } from './dropdown-menu.recipe'
import type { DropdownMenuT } from './dropdown-menu.types'

export function DropdownMenuTrigger<T extends ValidComponent = 'button'>(
  props: DropdownMenuT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'style',
    'disabled',
    'ref' as any,
  ])
  const context = useDropdownMenuContext()

  const resolved = createStyles(dropdownMenuRecipe, local, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.presentation,
  })
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({
    tag,
    bridgeClick: true,
    ref: () => local.ref,
    registration: { element: context.triggerElement, ref: context.setTriggerElement },
  })
  const disabled = () => Boolean(local.disabled ?? context.disabled())
  const userEvents = rest as Record<string, unknown>
  let keyboardActivation = false
  const events = mergeProps(rest, {
    onKeyDown(event: KeyboardEvent) {
      callHandler(event, userEvents.onKeyDown)
      if (event.defaultPrevented || disabled() || event.target !== event.currentTarget) {
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        context.openWithStrategy(event.key === 'ArrowDown' ? 'first' : 'last')
      } else if (event.key === 'Escape' && context.isOpen()) {
        event.preventDefault()
        context.commitOpen(false)
      } else if (event.key === 'Enter' || event.key === ' ') {
        keyboardActivation = true
      }
    },
    onKeyUp(event: KeyboardEvent) {
      callHandler(event, userEvents.onKeyUp)
      queueMicrotask(() => {
        keyboardActivation = false
      })
    },
    onBlur(event: FocusEvent) {
      keyboardActivation = false
      callHandler(event, userEvents.onBlur)
    },
    onPointerDown(event: PointerEvent) {
      keyboardActivation = false
      callHandler(event, userEvents.onPointerDown)
    },
  })
  const interaction = useButtonInteraction(
    {
      tag,
      element: root.element,
      disabled,
      disabledForComponent: true,
      manualKeyboardActivation: true,
      onPress(event) {
        const strategy = keyboardActivation && event.detail === 0 ? 'first' : 'content'
        keyboardActivation = false
        if (context.isOpen()) {
          context.commitOpen(false)
        } else {
          context.openWithStrategy(strategy)
        }
      },
    },
    events,
  )
  const triggerProps = mergeProps(
    { 'data-slot': 'dropdown-menu-trigger' },
    context.triggerProps,
    interaction,
  )
  const binding = root.bind(triggerProps)
  const children = resolveChildren(() => local.children)
  onMount(() => validateOverlayTrigger(context.triggerElement(), 'DropdownMenu'))
  return (
    <Dynamic component={tag()} {...binding} {...resolved.styles.trigger}>
      {children()}
    </Dynamic>
  )
}
