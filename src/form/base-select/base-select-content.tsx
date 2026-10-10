import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, Show, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { useFloatingPosition } from '../../overlay/base/floating'
import { useOverlayInteraction } from '../../overlay/base/interaction'
import { acquireBodyScrollLock } from '../../overlay/base/utils'
import { createStyles } from '../../provider/create-styles'
import { createTransitionPresence } from '../../shared/transition-presence'
import { callRef } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import {
  BASE_SELECT_POSITIONER_CLASS,
  baseSelectDataAttributes,
  baseSelectRecipe,
} from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectContent(props: BaseSelectT.ContentProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, [
    'children',
    'ref',
    'class',
    'style',
    'gutter',
    'overflowPadding',
    'onExitComplete',
  ])
  const resolved = createStyles(baseSelectRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => state.stylePresentation,
    inheritedVariants: () => ({ size: state.styleSize }),
  })
  const presence = createTransitionPresence({
    open: state.open,
    onExitComplete: () => {
      state.setHighlightedValue(undefined)
      local.onExitComplete?.()
    },
  })
  const [content, setContent] = createSignal<HTMLDivElement>()
  const [positioner, setPositioner] = createSignal<HTMLDivElement>()
  const [side, setSide] = createSignal('bottom')
  useFloatingPosition({
    contentElement: content,
    floatingElement: positioner,
    getReferenceElement: () => state.anchor() ?? state.focusOwner(),
    gutter: () => local.gutter ?? 0,
    onPositionedChange: () => undefined,
    onPlacementChange: (placement) => setSide(placement.split('-')[0] ?? 'bottom'),
    open: presence.present,
    overflowPadding: () => local.overflowPadding ?? 4,
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
            {...baseSelectDataAttributes.content({
              expanded: () => presence.dataAttrs()['data-expanded'],
              closed: () => presence.dataAttrs()['data-closed'],
              side,
            })}
            {...rest}
            ref={(element) => {
              setContent(element)
              presence.setElement(element)
              callRef(local.ref, element)
            }}
            {...resolved.styles.content}
          >
            {local.children}
          </div>
        </div>
      </Portal>
    </Show>
  )
}
