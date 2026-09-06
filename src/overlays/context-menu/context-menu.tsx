import type { JSX, ValidComponent } from 'solid-js'
import {
  children as resolveChildren,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import type { ElementProps } from '../../shared/types.ts'
import { useEventListener } from '../../shared/use-event-listener.ts'
import { useId } from '../../shared/utils.ts'
import { OverlayMenu } from '../base/menu/index.ts'
import type { OverlayMenuFocusStrategy } from '../base/menu/index.ts'
import type { OverlayTriggerProps } from '../base/trigger.ts'
import {
  createOverlayTriggerRef,
  getOverlayTriggerAccessibility,
  mergeMenuTriggerProps,
  validateOverlayTrigger,
} from '../base/trigger.ts'

import type { ContextMenuProps, ContextMenuT } from './context-menu.types.ts'

export type { ContextMenuProps, ContextMenuT } from './context-menu.types.ts'

const CONTEXT_MENU_LONG_PRESS_DELAY = 700
const CONTEXT_MENU_LONG_PRESS_MOVE_TOLERANCE = 10
const CONTEXT_MENU_POINTER_EVENT_GUARD_DELAY = 1_000
const CONTEXT_MENU_SUPPRESSION_DELAY = 1_000

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
function createContextMenu(props: ContextMenuProps) {
  const merged = mergeProps(
    {
      placement: 'right-start' as const,
      gutter: 0,
      shift: 4,
    },
    props,
  )

  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(
    untrack(() => Boolean(merged.defaultOpen)),
  )
  const [autoFocusStrategy, setAutoFocusStrategy] =
    createSignal<OverlayMenuFocusStrategy>('content')
  const [anchorPoint, setAnchorPoint] = createSignal<{ x: number; y: number } | null>(null)
  const trigger = createOverlayTriggerRef()
  const resolvedOpen = createMemo(() => merged.open ?? uncontrolledOpen())
  const resolvedId = useId(() => merged.id, 'contextmenu')
  const contentId = createMemo(() => `${resolvedId()}-content`)
  let longPressTimeoutId = 0
  let pointerEventGuardTimeoutId = 0
  let suppressionTimeoutId = 0
  let initiatingPointerId: number | undefined
  let longPressStartPoint: { x: number; y: number } | undefined
  let longPressGestureBlocked = false
  const activeLongPressPointers = new Set<number>()
  let pointerEventGuard: { pointerId: number; pointerType: string } | undefined
  let suppressedContextMenu: { pointerType: string; x: number; y: number } | undefined

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
    const rect = trigger.element()?.getBoundingClientRect()

    if (!rect) {
      openFromPoint(0, 0, strategy)
      return
    }

    openFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, strategy)
  }

  /** Consume the deferred native contextmenu event emitted after dismissing from right-click or long-press input. */
  const consumeSuppressedContextMenu = (event: MouseEvent): boolean => {
    const suppression = suppressedContextMenu
    if (!suppression) {
      return false
    }

    const eventPointerType =
      typeof PointerEvent !== 'undefined' && event instanceof PointerEvent
        ? event.pointerType
        : undefined
    const matchesPointerType = !eventPointerType || eventPointerType === suppression.pointerType
    const matchesPoint =
      Math.abs(event.clientX - suppression.x) <= 1 && Math.abs(event.clientY - suppression.y) <= 1

    if (!matchesPointerType || !matchesPoint) {
      return false
    }

    window.clearTimeout(suppressionTimeoutId)
    suppressionTimeoutId = 0
    suppressedContextMenu = undefined
    event.preventDefault()
    event.stopPropagation()
    return true
  }

  const setContextMenuSuppression = (pointerType: string, x: number, y: number): void => {
    window.clearTimeout(suppressionTimeoutId)
    suppressedContextMenu = { pointerType, x, y }
    suppressionTimeoutId = window.setTimeout(() => {
      suppressionTimeoutId = 0
      suppressedContextMenu = undefined
    }, CONTEXT_MENU_SUPPRESSION_DELAY)
  }

  /** Suppress the follow-up contextmenu event after dismissing from secondary click or long-press input. */
  const suppressContextMenuFromPointer = (event: PointerEvent): void => {
    if (isTouchOrPen(event.pointerType) || event.button === 2) {
      setContextMenuSuppression(event.pointerType, event.clientX, event.clientY)
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
    initiatingPointerId = undefined
  }

  const setCompletingPointerEventGuard = (pointerId: number, pointerType: string): void => {
    window.clearTimeout(pointerEventGuardTimeoutId)
    pointerEventGuard = {
      pointerId,
      pointerType,
    }
    pointerEventGuardTimeoutId = window.setTimeout(() => {
      pointerEventGuardTimeoutId = 0
      pointerEventGuard = undefined
    }, CONTEXT_MENU_POINTER_EVENT_GUARD_DELAY)
  }

  onCleanup(() => {
    clearLongPressTimeout()
    if (typeof window !== 'undefined') {
      window.clearTimeout(pointerEventGuardTimeoutId)
      window.clearTimeout(suppressionTimeoutId)
    }
    activeLongPressPointers.clear()
    pointerEventGuard = undefined
    suppressedContextMenu = undefined
  })

  const isPointerInsideTrigger = (event: MouseEvent): boolean => {
    const element = trigger.element()
    if (!element) {
      return false
    }

    const rect = element.getBoundingClientRect()

    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    )
  }

  onMount(() => {
    useEventListener(
      document,
      'pointerdown',
      (event) => {
        const guard = pointerEventGuard
        if (
          guard &&
          event.pointerId === guard.pointerId &&
          event.pointerType === guard.pointerType
        ) {
          event.preventDefault()
        }
      },
      true,
    )

    const onDocumentContextMenuCapture = (event: MouseEvent): void => {
      if (consumeSuppressedContextMenu(event)) {
        return
      }

      if (merged.disabled) {
        return
      }

      const targetInsideTrigger =
        event.target instanceof Node && Boolean(trigger.element()?.contains(event.target))
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

    activeLongPressPointers.add(event.pointerId)
    if (activeLongPressPointers.size > 1) {
      longPressGestureBlocked = true
      clearLongPressTimeout()
      return
    }

    if (longPressGestureBlocked) {
      return
    }

    setAnchorPoint({ x: event.clientX, y: event.clientY })
    initiatingPointerId = event.pointerId
    longPressStartPoint = { x: event.clientX, y: event.clientY }
    const pointerId = event.pointerId
    const pointerType = event.pointerType

    // oxlint-disable-next-line subf/solid-reactivity
    longPressTimeoutId = window.setTimeout(() => {
      longPressTimeoutId = 0
      if (initiatingPointerId !== pointerId) {
        return
      }

      const point = longPressStartPoint
      initiatingPointerId = undefined
      longPressStartPoint = undefined
      if (!point || untrack(() => merged.disabled)) {
        return
      }

      setCompletingPointerEventGuard(pointerId, pointerType)
      setContextMenuSuppression(pointerType, point.x, point.y)
      openFromPoint(point.x, point.y)
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

    if (
      initiatingPointerId !== event.pointerId ||
      hasLongPressMovedBeyondTolerance(longPressStartPoint, event)
    ) {
      clearLongPressTimeout()
    }
  }

  const onPointerCancel = (event: PointerEvent): void => {
    if (!isTouchOrPen(event.pointerType)) {
      return
    }

    activeLongPressPointers.delete(event.pointerId)
    if (initiatingPointerId === event.pointerId) {
      clearLongPressTimeout()
    }
    if (activeLongPressPointers.size === 0) {
      longPressGestureBlocked = false
    }
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (!isTouchOrPen(event.pointerType)) {
      return
    }

    activeLongPressPointers.delete(event.pointerId)
    if (initiatingPointerId === event.pointerId) {
      clearLongPressTimeout()
    }
    if (activeLongPressPointers.size === 0) {
      longPressGestureBlocked = false
    }
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

  const triggerProps = mergeProps(
    {
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
      get disabled() {
        return getOverlayTriggerAccessibility(trigger.element(), Boolean(merged.disabled)).disabled
      },
      get 'aria-disabled'() {
        return getOverlayTriggerAccessibility(trigger.element(), Boolean(merged.disabled))
          .ariaDisabled
      },
      get tabIndex() {
        return getOverlayTriggerAccessibility(trigger.element(), Boolean(merged.disabled)).tabIndex
      },
    },
    {
      ref: (element: HTMLElement | undefined) => {
        trigger.ref(element)
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
      onPointerCancel: (event: PointerEvent) => {
        if (!event.defaultPrevented) {
          onPointerCancel(event)
        }
      },
      onPointerUp: (event: PointerEvent) => {
        // Pointer-up cleanup must run even when a consumer prevents the native event.
        onPointerUp(event)
      },
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
    },
  ) as OverlayTriggerProps

  return {
    triggerProps,
    triggerElement: trigger.element,
    menuProps: {
      get id() {
        return resolvedId()
      },
      get open() {
        return resolvedOpen()
      },
      onClose: () => commitOpen(false),
      get triggerElement() {
        return trigger.element()
      },
      get placement() {
        return merged.placement
      },
      get gutter() {
        return merged.gutter
      },
      get shift() {
        return merged.shift
      },
      get autoFocusStrategy() {
        return autoFocusStrategy()
      },
      get preventScroll() {
        return merged.preventScroll
      },
      get overflowPadding() {
        return merged.overflowPadding
      },
      getAnchorRect,
      onContentPointerDown,
      onContentContextMenu,
    },
  }
}

const [ContextMenuProvider, useContextMenuContext] =
  createContextProvider<ReturnType<typeof createContextMenu>>('ContextMenu')

/** Menu state and interaction context, without a DOM root. */
export function ContextMenu(props: ContextMenuProps): JSX.Element {
  const context = createContextMenu(props)
  return <ContextMenuProvider value={context}>{props.children}</ContextMenuProvider>
}

function ContextMenuTrigger<T extends ValidComponent = 'div'>(
  props: ContextMenuT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'children', 'class', 'style'])
  const context = useContextMenuContext()
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    rootSlot: 'trigger',
    design: {
      get classes() {
        return design().contextMenu.recipe()
      },
    },
    get instance() {
      return local
    },
  })
  const binding = mergeMenuTriggerProps(
    mergeProps(rest, resolved.rootClassAndStyle()) as Partial<OverlayTriggerProps>,
    context.triggerProps,
  )
  const children = resolveChildren(() => local.children)
  onMount(() => validateOverlayTrigger(context.triggerElement(), 'ContextMenu'))
  return (
    <Dynamic component={(local.as as ValidComponent) ?? 'div'} type={undefined} {...binding}>
      {children()}
    </Dynamic>
  )
}

function ContextMenuContent(props: ContextMenuT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'itemRender',
    'itemProps',
    'contentTop',
    'contentBottom',
    'checkedIcon',
    'submenuIcon',
    'size',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const context = useContextMenuContext()
  const design = useMoraineDesign()
  const merged = mergeProps(
    { size: 'md' as const, checkedIcon: 'icon-check', submenuIcon: 'icon-chevron-right' },
    () => design().contextMenu.defaultVariants,
    local,
  )
  const resolved = resolveComponentStyle({
    rootSlot: 'content',
    design: {
      get classes() {
        return design().contextMenu.recipe({ size: merged.size })
      },
    },
    get instance() {
      return local
    },
  })
  return (
    <OverlayMenu<ContextMenuT.Item>
      {...context.menuProps}
      slotClassAndStyle={resolved.slotClassAndStyle}
      size={merged.size ?? undefined}
      items={merged.items}
      checkedIcon={merged.checkedIcon}
      submenuIcon={merged.submenuIcon}
      itemRender={merged.itemRender}
      contentProps={rest as ElementProps<HTMLDivElement>}
      itemProps={merged.itemProps}
      contentTop={merged.contentTop}
      contentBottom={merged.contentBottom}
    />
  )
}

ContextMenu.Trigger = ContextMenuTrigger
ContextMenu.Content = ContextMenuContent
