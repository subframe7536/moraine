import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, Show, splitProps } from 'solid-js'
import { Portal, isServer } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { bindElement } from '../../shared/element-binding'
import { createTransitionPresence } from '../../shared/transition-presence'
import { callRef } from '../../shared/utils'
import { useFloatingPosition } from '../shared/overlay/floating'
import { useOverlayInteraction } from '../shared/overlay/interaction'
import { resolveFloatingPlacement } from '../shared/overlay/placement'
import { acquireBodyScrollLock } from '../shared/overlay/scroll-lock'

import { useSelectContext } from './base-select-context'
import {
  BASE_SELECT_POSITIONER_CLASS,
  baseSelectDataAttributes,
  baseSelectRecipe,
} from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

/**
 * Floating popup panel of `BaseSelect`. It mounts in a portal only while the select is open, is
 * positioned against `BaseSelect.Control` (or the focus owner when there is none), and dismisses
 * on Escape or an outside press. Place it as a sibling of the control, inside `BaseSelect`, and
 * put `BaseSelect.Listbox` and optionally `BaseSelect.Empty` in it. Renders a `div`.
 *
 * @example
 * ```tsx
 * import { BaseSelect } from 'moraine'
 *
 * <BaseSelect items={[{ label: 'Option A', value: 'a' }]}>
 *   <BaseSelect.Trigger>Choose an option</BaseSelect.Trigger>
 *   <BaseSelect.Content>
 *     <BaseSelect.Listbox>
 *       <BaseSelect.Item item={{ label: 'Option A', value: 'a' }} />
 *     </BaseSelect.Listbox>
 *   </BaseSelect.Content>
 * </BaseSelect>
 * ```
 */
export function BaseSelectContent(props: BaseSelectT.ContentProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, ['ref', 'class', 'style'])
  const {
    slots: { content: contentSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'content',
    data: {
      content: baseSelectDataAttributes.content(() => ({
        expanded: state.open,
        closed: () => !state.open(),
        side,
      })),
    },
    context: () => ({ variants: { size: state.styleSize }, ...state.slotOverrides }),
  })
  const presence = createTransitionPresence({
    open: state.open,
    onExitComplete: () => {
      state.setHighlightedValue(undefined)
      state.onExitComplete?.()
    },
  })
  const [content, setContent] = createSignal<HTMLDivElement>()
  const [positioner, setPositioner] = createSignal<HTMLDivElement>()
  const [side, setSide] = createSignal('bottom')
  bindElement(content, presence.registerElement)
  useFloatingPosition({
    contentElement: content,
    floatingElement: positioner,
    getReferenceElement: () => state.anchor() ?? state.focusOwner(),
    flip: () => state.props.flip ?? true,
    gutter: () => state.props.gutter ?? 4,
    onPositionedChange: () => undefined,
    onPlacementChange: (placement) => setSide(placement.split('-')[0] ?? 'bottom'),
    open: presence.present,
    overflowPadding: () => state.props.overflowPadding ?? 4,
    placement: () =>
      resolveFloatingPlacement(state.props.placement ?? 'bottom', state.props.align ?? 'start'),
    shift: () => state.props.shift ?? 0,
    slide: () => state.props.slide ?? true,
  })
  createEffect(
    on(presence.present, (present) => {
      if (present) {
        onCleanup(acquireBodyScrollLock(state.anchor() ?? state.focusOwner()))
      } else {
        // The content unmounted with the Show branch; release its presence registration.
        setContent(undefined)
      }
    }),
  )
  useOverlayInteraction({
    containsTarget: (node) =>
      Boolean(
        state.anchor()?.contains(node) ||
        state.focusOwner()?.contains(node) ||
        positioner()?.contains(node),
      ),
    onPointerOutside: (event) => {
      if (state.open() && !event.defaultPrevented) {
        state.dismiss(state.props.closeOnOutsideClick)
      }
    },
    onFocusOutside: (event) => {
      if (state.open() && !event.defaultPrevented) {
        state.dismiss(state.props.closeOnOutsideClick)
      }
    },
    onEscape: (event) => {
      if (state.open() && !event.defaultPrevented) {
        event.preventDefault()
        state.dismiss(state.props.closeOnEscape)
      }
    },
    contentElement: content,
    enabled: presence.present,
    requireContent: true,
    triggerElement: () => state.anchor() ?? state.focusOwner(),
  })
  return (
    <Show when={presence.present()}>
      <Portal mount={(state.anchor() ?? state.focusOwner())?.ownerDocument.body}>
        <div
          data-slot={state.slotName('positioner')}
          ref={setPositioner}
          class={BASE_SELECT_POSITIONER_CLASS}
          style={isServer ? { visibility: 'hidden' } : undefined}
        >
          <div
            data-slot={state.slotName('content')}
            {...contentSlot}
            {...rest}
            ref={(element) => {
              setContent(element)
              callRef(local.ref, element)
            }}
          />
        </div>
      </Portal>
    </Show>
  )
}
