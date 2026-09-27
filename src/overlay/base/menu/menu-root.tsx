import type { ReferenceElement } from '@floating-ui/dom'
import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, on, onCleanup, untrack } from 'solid-js'
import { Portal } from 'solid-js/web'

import { useCn } from '../../../provider/cn-context'
import { dataSlotName } from '../../../shared/data-slot.ts'
import { useTransitionPresence } from '../../../shared/use-transition-presence'
import { useId } from '../../../shared/utils'
import { containsComposed, isNode } from '../dom'
import { useOverlayInteraction } from '../interaction'
import {
  acquireBodyScrollLock,
  focusTrigger,
  focusWithoutScrolling,
  getFocusableElements,
} from '../utils'

import { OverlayMenuLayer, resolveMenuSlot } from './menu-layer'
import { createVirtualReference } from './menu.utils'
import type { OverlayMenuCloseOptions, OverlayMenuLayerState } from './menu.utils'
import type { OverlayMenuProps, OverlayMenuSharedItem } from './types'

export function OverlayMenu<TItem extends OverlayMenuSharedItem<TItem>>(
  props: OverlayMenuProps<TItem>,
): JSX.Element {
  const cn = useCn()
  const rootId = useId(() => props.id, 'overlaymenu')
  const contentId = createMemo(() => `${rootId()}-content`)
  const contentPresence = useTransitionPresence({
    open: () => props.open,
  })
  const branches = new Set<HTMLElement>()
  const [pendingFocusOnClose, setPendingFocusOnClose] = createSignal<'trigger' | 'next'>()
  const [rootLayerState, setRootLayerState] = createSignal<OverlayMenuLayerState | undefined>(
    undefined,
  )

  createEffect(
    on(contentPresence.present, (present) => {
      if (present) {
        return
      }

      contentPresence.setElement(undefined)
    }),
  )

  createEffect(
    on(
      [() => props.open, pendingFocusOnClose, () => props.triggerElement],
      ([open, pendingFocus, triggerElement]) => {
        if (open || !pendingFocus) {
          return
        }

        queueMicrotask(() => {
          untrack(() => {
            if (props.open || pendingFocusOnClose() !== pendingFocus) {
              return
            }

            if (pendingFocus === 'trigger') {
              focusTrigger(triggerElement)
            } else if (triggerElement) {
              const focusableElements = getFocusableElements(
                triggerElement.ownerDocument.body,
              ).filter(
                (element) => ![...branches].some((branch) => containsComposed(branch, element)),
              )
              const triggerIndexes = focusableElements.flatMap((element, index) =>
                element === triggerElement || containsComposed(triggerElement, element)
                  ? [index]
                  : [],
              )
              const triggerIndex = triggerIndexes[triggerIndexes.length - 1]
              if (triggerIndex !== undefined) {
                focusWithoutScrolling(focusableElements[triggerIndex + 1])
              }
            }

            setPendingFocusOnClose(undefined)
          })
        })
      },
    ),
  )

  createEffect(
    on(
      [() => props.open, rootLayerState, () => rootLayerState()?.submenus()],
      ([open, layer, submenus]) => {
        if (!open && layer) {
          layer.closeSubmenus(undefined, submenus)
        }
      },
    ),
  )

  createEffect(
    on(
      [contentPresence.present, () => rootLayerState()?.contentElement()],
      ([present, content]) => {
        if (!present || !(props.preventScroll ?? true) || !content) {
          return
        }

        const releaseBodyScrollLock = acquireBodyScrollLock(content)

        onCleanup(() => {
          releaseBodyScrollLock?.()
        })
      },
    ),
  )

  const containsTarget = (node: Node): boolean => {
    if (props.triggerElement?.contains(node)) {
      return true
    }

    for (const branch of branches) {
      if (branch.contains(node)) {
        return true
      }
    }

    return false
  }

  const closeRoot = (options?: OverlayMenuCloseOptions): void => {
    if (options?.restoreFocus) {
      setPendingFocusOnClose('trigger')
    }

    rootLayerState()?.closeSubmenus()
    props.onClose()
  }

  const closeOnTab = (direction: 'forward' | 'backward'): void => {
    setPendingFocusOnClose(direction === 'backward' ? 'trigger' : 'next')
    rootLayerState()?.closeSubmenus()
    props.onClose()
  }

  useOverlayInteraction({
    containsTarget,
    contentElement: () => rootLayerState()?.contentElement(),
    triggerElement: () => props.triggerElement,
    onPointerOutside: (event) => {
      if (props.open && !event.defaultPrevented) {
        closeRoot()
      }
    },
    onFocusOutside: (event) => {
      if (props.open && !event.defaultPrevented) {
        closeRoot()
      }
    },
    onEscape: (event, context) => {
      const target = event.target
      if (!props.open || (isNode(target) && context.isInside(target)) || event.defaultPrevented) {
        return
      }

      event.preventDefault()
      closeRoot()
    },
    enabled: contentPresence.present,
    requireContent: true,
  })

  const getReferenceElement = createMemo<ReferenceElement | undefined>(() => {
    const anchorRect = props.getAnchorRect?.(props.triggerElement)

    if (anchorRect) {
      return createVirtualReference(anchorRect, props.triggerElement)
    }

    return props.triggerElement
  })

  return (
    <Show when={contentPresence.present()}>
      <Portal mount={props.triggerElement?.ownerDocument.body}>
        <Show when={props.preventScroll ?? true}>
          <div
            data-slot={dataSlotName(props.owner, 'overlay')}
            aria-hidden="true"
            {...resolveMenuSlot(props, 'overlay', cn)}
          />
        </Show>
        <OverlayMenuLayer<TItem>
          owner={props.owner}
          id={contentId()}
          ariaLabelledBy={props.triggerElement?.id}
          open={props.open}
          close={closeRoot}
          closeOnTab={closeOnTab}
          closeRoot={closeRoot}
          depth={0}
          items={props.items}
          classes={props.classes}
          styles={props.styles}
          slotBinding={props.slotBinding}
          size={props.size}
          checkedIcon={props.checkedIcon}
          submenuIcon={props.submenuIcon}
          itemRender={props.itemRender}
          contentProps={props.contentProps}
          itemProps={props.itemProps}
          contentTop={props.contentTop}
          contentBottom={props.contentBottom}
          getReferenceElement={getReferenceElement}
          placement={props.placement}
          align={props.align}
          gutter={props.gutter}
          shift={props.shift}
          overflowPadding={props.overflowPadding}
          present={contentPresence.present}
          presenceDataAttrs={contentPresence.dataAttrs}
          registerBranch={(element) => {
            branches.add(element)

            return () => {
              branches.delete(element)
            }
          }}
          setPresenceElement={contentPresence.setElement}
          autoFocusStrategy={props.autoFocusStrategy}
          onAutoFocusHandled={props.onAutoFocusHandled}
          onContentPointerDown={props.onContentPointerDown}
          onContextMenu={props.onContentContextMenu}
          refState={setRootLayerState}
        />
      </Portal>
    </Show>
  )
}
