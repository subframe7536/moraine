import type { JSX } from 'solid-js'
import {
  Show,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { ElementProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useEventListener } from '../../shared/use-event-listener.ts'
import { useId } from '../../shared/utils.ts'
import { OverlayMenu } from '../base/menu/index.ts'
import type {
  OverlayMenuFocusStrategy,
  OverlayMenuItemVariantProps,
  OverlayMenuRootProps,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
  OverlayMenuSharedSlots,
} from '../base/menu/index.ts'
import type { OverlayTriggerProps } from '../base/trigger.ts'
import { validateOverlayTrigger } from '../base/trigger.ts'

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
    children?: (props: OverlayTriggerProps) => JSX.Element
  }

  /**
   * Props for the ContextMenu component.
   */
  export type TriggerProps = OverlayTriggerProps
  export type Props = Base & Variant
}

/**
 * Props for the ContextMenu component.
 */
export type ContextMenuProps = ContextMenuT.Props

type ContextMenuRuntimeProps = ContextMenuT.Base

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
  const [local] = splitProps(props as ContextMenuRuntimeProps, [
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
    'children',
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

      // Let the trigger handler compose user callbacks for events targeted inside the trigger.
      if (targetInsideTrigger || !pointerInsideTrigger) {
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

    if (resolvedOpen()) {
      commitOpen(false)
      return
    }

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

      if (untrack(() => merged.disabled)) {
        return
      }

      if (isUncontrolled) {
        setUncontrolledOpen(true)
      }

      onOpenChange?.(true)
    }, CONTEXT_MENU_LONG_PRESS_DELAY)
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (!isTouchOrPen(event.pointerType)) {
      return
    }

    if (merged.disabled) {
      clearLongPressTimeout()
      return
    }

    if (hasLongPressMovedBeyondTolerance(longPressStartPoint, event)) {
      clearLongPressTimeout()
    }
  }

  const onPointerCancel = (event: PointerEvent): void => {
    if (!isTouchOrPen(event.pointerType)) {
      return
    }

    clearLongPressTimeout()
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (!isTouchOrPen(event.pointerType)) {
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

  const triggerRender = createMemo(() => merged.children)
  const triggerProps: OverlayTriggerProps = {
    id: resolvedId(),
    get 'aria-controls'() {
      return resolvedOpen() ? contentId() : undefined
    },
    'aria-haspopup': 'menu',
    get 'aria-expanded'() {
      return resolvedOpen() ? 'true' : 'false'
    },
    get 'data-closed'() {
      return resolvedOpen() ? undefined : ''
    },
    get 'data-disabled'() {
      return merged.disabled ? '' : undefined
    },
    get 'data-expanded'() {
      return resolvedOpen() ? '' : undefined
    },
    'data-slot': 'trigger',
    tabIndex: 0,
    ref: (element: HTMLElement | undefined) => {
      triggerElement = element
    },
    onContextMenu: (event: MouseEvent) => {
      if (event.defaultPrevented) {
        clearLongPressTimeout()
        return
      }
      onContextMenu(event)
    },
    onPointerDown: (event: PointerEvent) => {
      if (!event.defaultPrevented) {
        onPointerDown(event)
      }
    },
    onPointerMove: (event: PointerEvent) => {
      if (!event.defaultPrevented) {
        onPointerMove(event)
      }
    },
    onPointerCancel,
    onPointerUp,
    onKeyDown: (event: KeyboardEvent) => {
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
    },
  }

  onMount(() => {
    if (triggerRender()) {
      validateOverlayTrigger(triggerElement, 'ContextMenu')
    }
  })

  return (
    <>
      <Show when={triggerRender()}>
        {(render) => renderComponentOrElement(render(), triggerProps)}
      </Show>

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
