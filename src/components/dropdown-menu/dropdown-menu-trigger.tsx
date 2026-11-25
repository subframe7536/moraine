import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { merge, onSettled, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { createKeyDownHandler } from '../../shared/keyboard'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler, pick } from '../../shared/utils'
import { validateOverlayTrigger } from '../shared/overlay/trigger'

import { useDropdownMenuContext } from './dropdown-menu-context'
import { dropdownMenuRecipe } from './dropdown-menu.recipe'
import type { DropdownMenuT } from './dropdown-menu.types'
/**
 * Element that opens and closes the surrounding `DropdownMenu`, wiring click, keyboard (Enter,
 * Space, ArrowDown, ArrowUp), and ARIA behavior. Place it inside `DropdownMenu`; it renders a
 * `button` by default, or pass `as` to render another component such as `Button`.
 *
 * @example
 * ```tsx
 * import { Button, DropdownMenu } from 'moraine'
 *
 * <DropdownMenu>
 *   <DropdownMenu.Trigger as={Button}>Account options</DropdownMenu.Trigger>
 *   <DropdownMenu.Content items={[{ label: 'Edit profile' }]} />
 * </DropdownMenu>
 * ```
 */
export function DropdownMenuTrigger<T extends ValidComponent = 'button'>(
  props: DropdownMenuT.TriggerProps<T>,
): JSX.Element {
  const local = pick(props as DropdownMenuT.TriggerProps, 'as', 'class', 'style', 'disabled', 'ref')
  const rest = omit(props as DropdownMenuT.TriggerProps, 'as', 'class', 'style', 'disabled', 'ref')
  const context = useDropdownMenuContext()

  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(dropdownMenuRecipe, local, {
    slot: 'trigger',
    context: () => context.slotOverrides,
  })
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({
    tag,
    bridgeClick: true,
    ref: () => local.ref,
    registration: { element: context.triggerElement, setElement: context.setTriggerElement },
  })
  const disabled = () => local.disabled ?? context.disabled()
  const userEvents = rest as Record<string, unknown>
  let keyboardActivation = false
  const events = merge(rest, {
    onKeyDown: createKeyDownHandler({
      onKeyDown: () =>
        userEvents.onKeyDown as JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined,
      disabled,
      currentTargetOnly: true,
      keys: {
        ArrowDown: () => context.openWithStrategy('first'),
        ArrowUp: () => context.openWithStrategy('last'),
        Escape: {
          handle: () => context.commitOpen(false),
          when: () => context.isOpen(),
        },
        // Native click activation follows; flag it so onPress opens with 'first'.
        Enter: { handle: () => (keyboardActivation = true), preventDefault: false },
        ' ': { handle: () => (keyboardActivation = true), preventDefault: false },
      },
    }),
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
  const triggerProps = merge(
    { 'data-slot': 'dropdown-menu-trigger' },
    context.triggerProps,
    triggerSlot,
    interaction,
  )
  const binding = root.bind(triggerProps)
  onSettled(() => {
    let active = true
    queueMicrotask(() => {
      if (active) {
        validateOverlayTrigger(root.element(), 'DropdownMenu')
      }
    })
    return () => {
      active = false
    }
  })
  const Root = dynamic<ValidComponent>(tag)
  return <Root {...binding} />
}
