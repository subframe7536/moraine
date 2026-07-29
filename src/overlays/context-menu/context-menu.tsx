import type { JSX } from 'solid-js'
import {
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'

import type { IconT } from '../../elements/icon'
import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, ElementProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useEventListener } from '../../shared/use-event-listener'
import { callHandler, callRef, cn, useId } from '../../shared/utils'
import { OverlayMenu } from '../base/menu'
import type {
  OverlayMenuFocusStrategy,
  OverlayMenuItemVariantProps,
  OverlayMenuRootProps,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
  OverlayMenuSharedSlots,
} from '../base/menu'

export namespace ContextMenuT {
  export interface Slot<T = unknown> extends OverlayMenuSharedSlots<T> {}
  export type Variant = Pick<OverlayMenuItemVariantProps, 'size'>
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item extends OverlayMenuSharedItem<Item> {}
  export type ItemRenderProps = OverlayMenuSharedItemRenderProps<Item>

  /**
   * Base props for the ContextMenu component.
   */
  export interface Base extends Omit<OverlayMenuRootProps<Item>, 'itemProps' | 'itemRender'> {
    /** Custom renderer for individual items. */
    itemRender?: ComponentOrElement<ItemRenderProps>
    /** Additional attributes for an interactive menu item. */
    itemProps?: (props: ItemRenderProps) => ElementProps<HTMLDivElement> | undefined
    /**
     * Target area that opens the context menu on right-click or long press.
     */
    children: JSX.Element
    onContextMenu?: JSX.EventHandlerUnion<HTMLSpanElement, MouseEvent>
    onPointerDown?: JSX.EventHandlerUnion<HTMLSpanElement, PointerEvent>
    onPointerMove?: JSX.EventHandlerUnion<HTMLSpanElement, PointerEvent>
    onPointerCancel?: JSX.EventHandlerUnion<HTMLSpanElement, PointerEvent>
    onPointerUp?: JSX.EventHandlerUnion<HTMLSpanElement, PointerEvent>
    onKeyDown?: JSX.EventHandlerUnion<HTMLSpanElement, KeyboardEvent>
  }

  /**
   * Props for the ContextMenu component.
   */
  export type Props = BaseProps<'span', Base, Variant, Slot>
}

/**
 * Props for the ContextMenu component.
 */
export interface ContextMenuProps extends ContextMenuT.Props {}

const CONTEXT_MENU_LONG_PRESS_DELAY = 700
const CONTEXT_MENU_LONG_PRESS_MOVE_TOLERANCE = 10

function isTouchOrPen(pointerType: string): boolean {
  return pointerType === 'touch' || pointerType === 'pen'
}

function hasLongPressMovedBeyondTolerance(
  startPoint: { x: number; y: number } | undefined,
  event: PointerEvent,
): boolean {
  if (!startPoint) {
    return false
  }

  const x = event.clientX - startPoint.x
  const y = event.clientY - startPoint.y

  return x * x + y * y > CONTEXT_MENU_LONG_PRESS_MOVE_TOLERANCE ** 2
}

function isContextMenuKeyboardEvent(event: KeyboardEvent): boolean {
  return event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)
}

/**
 * Menu triggered by right-click or long press on its child content.
 */
export function ContextMenu(props: ContextMenuProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'items',
    'itemRender',
    'itemProps',
    'contentProps',
    'contentTop',
    'contentBottom',
    'placement',
    'gutter',
    'preventScroll',
    'overflowPadding',
    'checkedIcon',
    'submenuIcon',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'children',
    'onContextMenu',
    'onPointerDown',
    'onPointerMove',
    'onPointerCancel',
    'onPointerUp',
    'onKeyDown',
    'ref',
  ])
  const merged = mergeProps(
    {
      size: 'md' as const,
      checkedIcon: 'icon-check' as IconT.Name,
      submenuIcon: 'icon-chevron-right' as IconT.Name,
      placement: 'right-start' as const,
      gutter: 0,
    },
    local,
  )
  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(
    untrack(() => Boolean(merged.defaultOpen)),
  )
  const [autoFocusStrategy, setAutoFocusStrategy] =
    createSignal<OverlayMenuFocusStrategy>('content')
  const [anchorPoint, setAnchorPoint] = createSignal<{ x: number; y: number } | null>(null)
  const [suppressNextContextMenu, setSuppressNextContextMenu] = createSignal(false)
  const resolvedOpen = createMemo(() => merged.open ?? uncontrolledOpen())
  const resolvedId = useId(() => merged.id, 'contextmenu')
  const contentId = createMemo(() => `${resolvedId()}-content`)
  let longPressTimeoutId = 0
  let longPressStartPoint: { x: number; y: number } | undefined
  let triggerElement: HTMLElement | undefined

  const commitOpen = (open: boolean): void => {
    if (!open) {
      setAutoFocusStrategy('none')
    }

    if (merged.open === undefined) {
      setUncontrolledOpen(open)
    }

    merged.onOpenChange?.(open)
  }

  const openFromPoint = (
    x: number,
    y: number,
    strategy: OverlayMenuFocusStrategy = 'content',
  ): void => {
    if (merged.disabled) {
      return
    }

    setAutoFocusStrategy(strategy)
    setAnchorPoint({ x, y })
    commitOpen(true)
  }

  const openFromTriggerCenter = (strategy: OverlayMenuFocusStrategy): void => {
    const rect = triggerElement?.getBoundingClientRect()

    if (!rect) {
      openFromPoint(0, 0, strategy)
      return
    }

    openFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, strategy)
  }

  /** Consume the deferred native contextmenu event emitted after dismissing from right-click or long-press input. */
  const consumeSuppressedContextMenu = (event: MouseEvent): boolean => {
    if (!suppressNextContextMenu()) {
      return false
    }

    setSuppressNextContextMenu(false)
    event.preventDefault()
    event.stopPropagation()
    return true
  }

  /** Suppress the follow-up contextmenu event after dismissing from secondary click or long-press input. */
  const suppressContextMenuFromPointer = (event: PointerEvent): void => {
    if (isTouchOrPen(event.pointerType) || event.button === 2) {
      setSuppressNextContextMenu(true)
    }
  }

  const onContentPointerDown = (event: PointerEvent): void => {
    if (event.target instanceof Element && event.target.closest('[data-slot="item"]')) {
      return
    }

    suppressContextMenuFromPointer(event)
    commitOpen(false)
  }

  const clearLongPressTimeout = (): void => {
    if (typeof window === 'undefined') {
      return
    }

    window.clearTimeout(longPressTimeoutId)
    longPressTimeoutId = 0
    longPressStartPoint = undefined
  }

  onCleanup(() => {
    clearLongPressTimeout()
  })

  const isPointerInsideTrigger = (event: MouseEvent): boolean => {
    if (!triggerElement) {
      return false
    }

    const rect = triggerElement.getBoundingClientRect()

    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    )
  }

  onMount(() => {
    const onDocumentContextMenuCapture = (event: MouseEvent): void => {
      if (consumeSuppressedContextMenu(event)) {
        return
      }

      if (merged.disabled) {
        return
      }

      const targetInsideTrigger =
        event.target instanceof Node && Boolean(triggerElement?.contains(event.target))
      const pointerInsideTrigger = isPointerInsideTrigger(event)

      if (!targetInsideTrigger && !pointerInsideTrigger) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (resolvedOpen()) {
        commitOpen(false)
        return
      }

      openFromPoint(event.clientX, event.clientY)
    }

    useEventListener(document, 'contextmenu', onDocumentContextMenuCapture, true)
  })

  const onContextMenu = (event: MouseEvent): void => {
    if (consumeSuppressedContextMenu(event)) {
      return
    }

    if (event.defaultPrevented || merged.disabled) {
      return
    }

    clearLongPressTimeout()
    event.preventDefault()
    event.stopPropagation()
    openFromPoint(event.clientX, event.clientY)
  }

  const onContentContextMenu = (event: MouseEvent): void => {
    if (consumeSuppressedContextMenu(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (resolvedOpen()) {
      commitOpen(false)
    }
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (merged.disabled) {
      return
    }

    clearLongPressTimeout()

    if (resolvedOpen()) {
      suppressContextMenuFromPointer(event)
      commitOpen(false)
      return
    }

    if (!isTouchOrPen(event.pointerType)) {
      return
    }

    setAnchorPoint({ x: event.clientX, y: event.clientY })
    longPressStartPoint = { x: event.clientX, y: event.clientY }

    const isUncontrolled = merged.open === undefined
    const onOpenChange = merged.onOpenChange

    longPressTimeoutId = window.setTimeout(() => {
      longPressTimeoutId = 0
      longPressStartPoint = undefined

      if (isUncontrolled) {
        setUncontrolledOpen(true)
      }

      onOpenChange?.(true)
    }, CONTEXT_MENU_LONG_PRESS_DELAY)
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (merged.disabled || !isTouchOrPen(event.pointerType)) {
      return
    }

    if (hasLongPressMovedBeyondTolerance(longPressStartPoint, event)) {
      clearLongPressTimeout()
    }
  }

  const onPointerCancel = (event: PointerEvent): void => {
    if (merged.disabled || !isTouchOrPen(event.pointerType)) {
      return
    }

    clearLongPressTimeout()
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (merged.disabled || !isTouchOrPen(event.pointerType)) {
      return
    }

    clearLongPressTimeout()
  }

  const getAnchorRect = (
    anchor?: HTMLElement,
  ): { x: number; y: number; width: number; height: number } => {
    const point = anchorPoint()

    if (point) {
      return { x: point.x, y: point.y, width: 0, height: 0 }
    }

    if (anchor) {
      const rect = anchor.getBoundingClientRect()

      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: 0,
        height: 0,
      }
    }

    return { x: 0, y: 0, width: 0, height: 0 }
  }

  return (
    <>
      <span
        ref={(element) => {
          triggerElement = element
          callRef(local.ref, element)
        }}
        data-slot="trigger"
        data-disabled={merged.disabled ? '' : undefined}
        data-expanded={resolvedOpen() ? '' : undefined}
        data-closed={resolvedOpen() ? undefined : ''}
        tabIndex={-1}
        aria-haspopup="menu"
        aria-controls={resolvedOpen() ? contentId() : undefined}
        aria-expanded={resolvedOpen() ? 'true' : 'false'}
        {...rest}
        class={cn(merged.classes?.trigger, merged.class)}
        style={{ '-webkit-touch-callout': 'none', ...merged.styles?.trigger, ...merged.style }}
        onContextMenu={(event) => {
          callHandler(event, local.onContextMenu)
          if (!event.defaultPrevented) {
            onContextMenu(event)
          }
        }}
        onPointerDown={(event) => {
          callHandler(event, local.onPointerDown)
          if (!event.defaultPrevented) {
            onPointerDown(event)
          }
        }}
        onPointerMove={(event) => {
          callHandler(event, local.onPointerMove)
          if (!event.defaultPrevented) {
            onPointerMove(event)
          }
        }}
        onPointerCancel={(event) => {
          callHandler(event, local.onPointerCancel)
          if (!event.defaultPrevented) {
            onPointerCancel(event)
          }
        }}
        onPointerUp={(event) => {
          callHandler(event, local.onPointerUp)
          if (!event.defaultPrevented) {
            onPointerUp(event)
          }
        }}
        onKeyDown={(event) => {
          callHandler(event, local.onKeyDown)
          if (event.defaultPrevented || merged.disabled || !isContextMenuKeyboardEvent(event)) {
            return
          }

          event.preventDefault()
          event.stopPropagation()

          if (resolvedOpen()) {
            commitOpen(false)
            return
          }

          openFromTriggerCenter('first')
        }}
      >
        {merged.children}
      </span>

      <OverlayMenu<ContextMenuT.Item>
        id={resolvedId()}
        open={resolvedOpen()}
        onClose={() => {
          commitOpen(false)
        }}
        triggerElement={triggerElement}
        getAnchorRect={getAnchorRect}
        placement={merged.placement}
        gutter={merged.gutter}
        autoFocusStrategy={autoFocusStrategy()}
        onContentPointerDown={onContentPointerDown}
        onContentContextMenu={onContentContextMenu}
        classes={merged.classes}
        styles={merged.styles}
        size={merged.size}
        items={merged.items}
        checkedIcon={merged.checkedIcon}
        submenuIcon={merged.submenuIcon}
        itemRender={merged.itemRender}
        contentProps={merged.contentProps}
        itemProps={merged.itemProps}
        contentTop={merged.contentTop}
        contentBottom={merged.contentBottom}
        preventScroll={merged.preventScroll}
        overflowPadding={merged.overflowPadding}
      />
    </>
  )
}
