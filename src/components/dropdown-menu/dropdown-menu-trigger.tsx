import type { JSX } from 'solid-js'
import { mergeProps, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { createKeyDownHandler } from '../../shared/keyboard'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler } from '../../shared/utils'
import { validateOverlayTrigger } from '../shared/overlay/trigger'

import { useDropdownMenuContext } from './dropdown-menu-context'
import { dropdownMenuRecipe } from './dropdown-menu.recipe'
import type { DropdownMenuT } from './dropdown-menu.types'

export function DropdownMenuTrigger<T extends ValidComponent = 'button'>(
  props: DropdownMenuT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'disabled', 'ref' as any])
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
  const disabled = () => Boolean(local.disabled ?? context.disabled())
  const userEvents = rest as Record<string, unknown>
  let keyboardActivation = false
  const events = mergeProps(rest, {
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
  const triggerProps = mergeProps(
    { 'data-slot': 'dropdown-menu-trigger' },
    context.triggerProps,
    triggerSlot,
    interaction,
  )
  const binding = root.bind(triggerProps)
  onMount(() => validateOverlayTrigger(context.triggerElement(), 'DropdownMenu'))
  return <Dynamic component={tag()} {...binding} />
}
