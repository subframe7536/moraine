import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, Show, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { createTransitionPresence } from '../../shared/transition-presence'
import { callRef } from '../../shared/utils'
import { useFloatingPosition } from '../shared/overlay/floating'
import { useOverlayInteraction } from '../shared/overlay/interaction'
import { acquireBodyScrollLock } from '../shared/overlay/utils'

import { useSelectContext } from './base-select-context'
import {
  BASE_SELECT_POSITIONER_CLASS,
  baseSelectDataAttributes,
  baseSelectRecipe,
} from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

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
  useFloatingPosition({
    contentElement: content,
    floatingElement: positioner,
    getReferenceElement: () => state.anchor() ?? state.focusOwner(),
    gutter: () => state.gutter?.() ?? 0,
    onPositionedChange: () => undefined,
    onPlacementChange: (placement) => setSide(placement.split('-')[0] ?? 'bottom'),
    open: presence.present,
    overflowPadding: () => state.overflowPadding?.() ?? 4,
    placement: () => 'bottom-start',
  })
  createEffect(
    on(presence.present, (present) => {
      if (present) {
        onCleanup(acquireBodyScrollLock(state.anchor() ?? state.focusOwner()))
      } else {
        presence.setElement(undefined)
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
        state.setOpen(false)
      }
    },
    onFocusOutside: (event) => {
      if (state.open() && !event.defaultPrevented) {
        state.setOpen(false)
      }
    },
    onEscape: (event) => {
      if (state.open() && !event.defaultPrevented) {
        event.preventDefault()
        state.setOpen(false)
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
        >
          <div
            data-slot={state.slotName('content')}
            {...contentSlot}
            {...rest}
            ref={(element) => {
              setContent(element)
              presence.setElement(element)
              callRef(local.ref, element)
            }}
          />
        </div>
      </Portal>
    </Show>
  )
}
