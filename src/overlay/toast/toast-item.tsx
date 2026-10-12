import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
  untrack,
} from 'solid-js'

import { Button } from '../../element/button'
import { Icon } from '../../element/icon'
import { Progress } from '../../element/progress'
import { createStyles, useCn } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { renderWithProps } from '../../shared/render-with-props'
import type { OverlayAlign } from '../../theme/style-types'

import { defaultToastMessages } from './toast.messages'
import { toastDataAttributes, toastRecipe } from './toast.recipe'
import { DEFAULT_TOAST_DURATION, DEFAULT_TOAST_GAP } from './toast.types'
import type { ToastT } from './toast.types'

const SWIPE_THRESHOLD = 45
const SWIPE_MIN_DISTANCE = 12
const SWIPE_VELOCITY = 0.11
/** Fallback unmount delay; matches recipe `duration-400` (swipe-out uses 200ms via transitionend). */
const TOAST_EXIT_MS = 400
/** Progress sample interval (~1 frame); the indicator has no CSS transition, so no lag. */
const PROGRESS_TICK_MS = 16

export interface ToastItemProps {
  toast: ToastT.Item
  index: number
  toastsCount: number
  visibleToasts: number
  offsetY: number
  expanded: boolean
  paused?: boolean
  placement?: ToastT.Placement
  align?: OverlayAlign
  closeButton?: boolean
  closeButtonAriaLabel?: string
  showProgress?: boolean
  invert?: boolean
  classes?: ToastT.Classes
  styles?: ToastT.Styles
  gap?: number
  duration?: number
  onHeight: (id: string | number, height: number) => void
  onDismiss: (id: string | number) => void
  onRemove: (id: string | number) => void
}

function isActionConfig(value: unknown): value is ToastT.Action {
  return typeof value === 'object' && value !== null && !(value instanceof Node) && 'label' in value
}

function isAwaySwipe(
  axis: 'x' | 'y',
  movedX: number,
  movedY: number,
  align: OverlayAlign,
  isTop: boolean,
): boolean {
  if (axis === 'x') {
    if (align === 'end') {
      return movedX > 0
    }
    if (align === 'start') {
      return movedX < 0
    }
    return movedX !== 0
  }
  if (isTop) {
    return movedY < 0
  }
  return movedY > 0
}

export function ToastItem(props: ToastItemProps): JSX.Element {
  const cn = useCn()
  const messages = useMessages('toast', defaultToastMessages)
  let itemRef: HTMLLIElement | undefined
  let dragStartTime = 0
  let pointerStart: { x: number; y: number } | null = null
  let dragAxis: 'x' | 'y' | null = null
  let exitTimerId: ReturnType<typeof setTimeout> | undefined
  let timerId: ReturnType<typeof setTimeout> | undefined
  let progressTimerId: ReturnType<typeof setInterval> | undefined
  let bumpTimerId: ReturnType<typeof setTimeout> | undefined
  let closeTimerStartTime = 0

  const initialDuration = () => props.toast.duration ?? props.duration ?? DEFAULT_TOAST_DURATION
  let remainingTime = untrack(initialDuration)

  const [mounted, setMounted] = createSignal(false)
  const [removed, setRemoved] = createSignal(false)
  const [swiping, setSwiping] = createSignal(false)
  const [swipeOffset, setSwipeOffset] = createSignal({ x: 0, y: 0 })
  // Non-null once swiped out; doubles as the swipe-out flag.
  const [swipeOutDirection, setSwipeOutDirection] = createSignal<
    'left' | 'right' | 'up' | 'down' | null
  >(null)
  const swipeOut = () => swipeOutDirection() !== null
  // Y offset captured when removal starts; read only together with removed().
  let offsetBeforeRemove = 0
  const [isBumping, setIsBumping] = createSignal(false)
  const [measuredHeight, setMeasuredHeight] = createSignal(0)
  const [progressPercent, setProgressPercent] = createSignal(100)

  const isFront = () => props.index === 0
  const isVisible = () => props.index < props.visibleToasts
  const isDismissible = () => props.toast.dismissible !== false
  const isLoading = () => props.toast.variant === 'loading'
  const showProgressBar = () =>
    (props.toast.showProgress ?? props.showProgress ?? false) && !isLoading()

  const isTop = () => {
    const p = props.toast.placement ?? props.placement ?? 'bottom'
    return p === 'top'
  }

  const lift = () => (isTop() ? 1 : -1)

  const scale = () => {
    if (props.expanded || isFront()) {
      return 1
    }
    return Math.max(0.85, 1 - props.index * 0.05)
  }

  const currentYOffset = () => {
    if (props.expanded) {
      return lift() * props.offsetY
    }
    return lift() * (props.index * (props.gap ?? DEFAULT_TOAST_GAP))
  }

  const opacity = () => {
    if (!mounted() || removed() || !isVisible()) {
      return 0
    }
    return 1
  }

  const height = () => {
    if (measuredHeight() > 0) {
      return `${measuredHeight()}px`
    }
    return 'auto'
  }

  const finishDelete = () => {
    if (exitTimerId) {
      clearTimeout(exitTimerId)
      exitTimerId = undefined
    }
    props.onRemove(props.toast.id)
  }

  const deleteToast = () => {
    if (untrack(removed)) {
      return
    }
    offsetBeforeRemove = untrack(currentYOffset)
    setRemoved(true)
    props.onHeight(props.toast.id, 0)

    exitTimerId = setTimeout(finishDelete, TOAST_EXIT_MS)
  }

  const handleEndTransition = (event: Event) => {
    if (removed() && event.target === itemRef) {
      finishDelete()
    }
  }

  createEffect(
    on(
      () => props.toast.dismissed,
      (dismissed) => {
        if (dismissed && !untrack(removed)) {
          deleteToast()
          props.toast.onDismiss?.(props.toast)
        }
      },
    ),
  )

  const transform = createMemo(() => {
    const dir = swipeOutDirection()
    if (dir) {
      const offset = swipeOffset()
      if (dir === 'left') {
        return `translate3d(calc(${offset.x}px - 100%), ${currentYOffset()}px, 0) scale(${scale()})`
      }
      if (dir === 'right') {
        return `translate3d(calc(${offset.x}px + 100%), ${currentYOffset()}px, 0) scale(${scale()})`
      }
      if (dir === 'up') {
        return `translate3d(${offset.x}px, calc(${currentYOffset() + offset.y}px - 100%), 0) scale(${scale()})`
      }
      if (dir === 'down') {
        return `translate3d(${offset.x}px, calc(${currentYOffset() + offset.y}px + 100%), 0) scale(${scale()})`
      }
    }

    if (swiping()) {
      const offset = swipeOffset()
      const x = offset.x
      const y = currentYOffset() + offset.y
      return `translate3d(${x}px, ${y}px, 0) scale(${scale()})`
    }

    if (removed()) {
      if (isFront()) {
        return `translate3d(0, ${lift() * -100}%, 0) scale(1)`
      }
      if (props.expanded) {
        return `translate3d(0, ${offsetBeforeRemove + (lift() > 0 ? -100 : 100)}px, 0) scale(1)`
      }
      return `translate3d(0, 40%, 0) scale(${scale()})`
    }

    if (!mounted()) {
      return `translate3d(0, ${lift() * -100}%, 0) scale(1)`
    }

    if (props.expanded) {
      return `translate3d(0, ${lift() * props.offsetY}px, 0) scale(1)`
    }

    if (isFront()) {
      return 'translate3d(0, 0px, 0) scale(1)'
    }

    return `translate3d(0, ${currentYOffset()}px, 0) scale(${scale()})`
  })

  // oxlint-disable-next-line subf/solid-reactivity -- Toast item styling binds to the stable toast instance.
  const resolved = createStyles(toastRecipe, props.toast, {
    inheritedVariants: () => ({
      invert: props.invert,
      placement: props.placement,
      align: props.align,
    }),
    inheritedStyles: () => ({
      classes: props.classes,
      styles: props.styles,
    }),
    variables: () => ({
      '--toast-gap': `${props.gap ?? DEFAULT_TOAST_GAP}px`,
    }),
  })

  const measureHeight = () => {
    if (itemRef) {
      const originalHeight = itemRef.style.height
      itemRef.style.height = 'auto'
      const h = itemRef.offsetHeight || itemRef.getBoundingClientRect().height
      itemRef.style.height = originalHeight
      if (h > 0) {
        setMeasuredHeight(h)
        props.onHeight(props.toast.id, h)
      }
    }
  }

  onMount(() => {
    measureHeight()
    requestAnimationFrame(() => setMounted(true))
    onCleanup(() => {
      props.onHeight(props.toast.id, 0)
    })
  })

  createEffect(
    on(
      [
        () => props.toast.title,
        () => props.toast.description,
        () => props.toast.jsx,
        () => props.toast.action,
        () => props.toast.cancel,
      ],
      () => {
        queueMicrotask(measureHeight)
      },
      { defer: true },
    ),
  )

  const bumpKey = () => props.toast.bumpKey

  createEffect(
    on(bumpKey, (key) => {
      if (!key) {
        return
      }
      setIsBumping(false)
      if (bumpTimerId) {
        clearTimeout(bumpTimerId)
      }
      requestAnimationFrame(() => {
        setIsBumping(true)
        bumpTimerId = setTimeout(() => setIsBumping(false), 240)
      })
    }),
  )

  // Keep remainingTime aligned when duration changes (e.g. host default or item update).
  // bumpKey already resets the timer for duplicate/update bumps.
  createEffect(
    on(
      initialDuration,
      (duration) => {
        remainingTime = duration
        closeTimerStartTime = 0
        setProgressPercent(100)
      },
      { defer: true },
    ),
  )

  const syncProgress = (left: number) => {
    const total = untrack(initialDuration)
    setProgressPercent(total > 0 && Number.isFinite(total) ? (left / total) * 100 : 100)
  }

  const isPaused = () =>
    isLoading() ||
    initialDuration() === Number.POSITIVE_INFINITY ||
    Boolean(props.paused) ||
    swiping()

  createEffect(
    on([isPaused, bumpKey], ([paused, bumpToken]) => {
      if (timerId) {
        clearTimeout(timerId)
        timerId = undefined
      }
      if (progressTimerId) {
        clearInterval(progressTimerId)
        progressTimerId = undefined
      }

      if (bumpToken) {
        remainingTime = initialDuration()
        closeTimerStartTime = 0
      }

      if (paused) {
        if (closeTimerStartTime > 0) {
          const elapsed = Date.now() - closeTimerStartTime
          remainingTime = Math.max(0, remainingTime - elapsed)
          closeTimerStartTime = 0
        }
        // Freeze the bar at the exact remaining fraction.
        syncProgress(remainingTime)
        return
      }

      closeTimerStartTime = Date.now()
      const currentRemaining = remainingTime

      if (currentRemaining <= 0) {
        props.toast.onAutoClose?.(props.toast)
        props.onDismiss(props.toast.id)
        return
      }

      timerId = setTimeout(() => {
        clearInterval(progressTimerId)
        progressTimerId = undefined
        // Dismiss and progress end share one clock: the bar is empty exactly at dismiss.
        syncProgress(0)
        props.toast.onAutoClose?.(props.toast)
        props.onDismiss(props.toast.id)
      }, currentRemaining)

      if (showProgressBar()) {
        syncProgress(currentRemaining)
        progressTimerId = setInterval(() => {
          syncProgress(Math.max(0, remainingTime - (Date.now() - closeTimerStartTime)))
        }, PROGRESS_TICK_MS)
      }
    }),
  )

  onCleanup(() => {
    clearTimeout(exitTimerId)
    clearTimeout(bumpTimerId)
    clearTimeout(timerId)
    clearInterval(progressTimerId)
  })

  function handlePointerDown(event: PointerEvent) {
    if (event.button === 2 || isLoading() || !isDismissible()) {
      return
    }

    const targetEl = event.target as HTMLElement | null
    if (targetEl?.closest('button, a, input, textarea, select, [data-swipe-ignore]')) {
      return
    }

    dragStartTime = Date.now()
    itemRef?.setPointerCapture?.(event.pointerId)
    setSwiping(true)
    pointerStart = { x: event.clientX, y: event.clientY }
    dragAxis = null
  }

  function handlePointerMove(event: PointerEvent) {
    if (!pointerStart || !isDismissible()) {
      return
    }

    const isHighlighted = window.getSelection()?.toString().length
    if (isHighlighted) {
      return
    }

    const xDelta = event.clientX - pointerStart.x
    const yDelta = event.clientY - pointerStart.y

    if (!dragAxis && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
      dragAxis = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y'
    }

    const getDampening = (delta: number) => 1 / (1.5 + Math.abs(delta) / 20)

    if (dragAxis === 'x') {
      const align = props.toast.align ?? props.align ?? 'end'
      let movement = xDelta
      if (align === 'end' && xDelta < 0) {
        movement = xDelta * getDampening(xDelta)
      } else if (align === 'start' && xDelta > 0) {
        movement = xDelta * getDampening(xDelta)
      }
      setSwipeOffset({ x: movement, y: 0 })
    } else if (dragAxis === 'y') {
      let movement = yDelta
      if (isTop() && yDelta > 0) {
        movement = yDelta * getDampening(yDelta)
      } else if (!isTop() && yDelta < 0) {
        movement = yDelta * getDampening(yDelta)
      }
      setSwipeOffset({ x: 0, y: movement })
    }
  }

  function handlePointerUp(event: PointerEvent) {
    if (!pointerStart || swipeOut()) {
      return
    }

    if (itemRef?.hasPointerCapture?.(event.pointerId)) {
      try {
        itemRef.releasePointerCapture(event.pointerId)
      } catch {}
    }

    const timeTaken = Math.max(Date.now() - dragStartTime, 1)
    const offset = swipeOffset()
    const movedX = offset.x
    const movedY = offset.y
    const primaryDistance = dragAxis === 'y' ? Math.abs(movedY) : Math.abs(movedX)
    const velocity = primaryDistance / timeTaken
    const align = props.toast.align ?? props.align ?? 'end'
    const allowed = dragAxis !== null && isAwaySwipe(dragAxis, movedX, movedY, align, isTop())
    const distanceOk = primaryDistance >= SWIPE_THRESHOLD
    const velocityOk = velocity > SWIPE_VELOCITY && primaryDistance >= SWIPE_MIN_DISTANCE

    pointerStart = null

    if (allowed && (distanceOk || velocityOk)) {
      if (dragAxis === 'x') {
        setSwipeOutDirection(movedX > 0 ? 'right' : 'left')
      } else {
        setSwipeOutDirection(movedY > 0 ? 'down' : 'up')
      }
      props.onDismiss(props.toast.id)
      return
    }

    setSwiping(false)
    dragAxis = null
    setSwipeOffset({ x: 0, y: 0 })
  }

  const role = () => props.toast.role ?? (props.toast.variant === 'error' ? 'alert' : 'status')

  const showCloseButton = () =>
    (props.toast.closeButton ?? props.closeButton ?? false) && !isLoading()

  const closeLabel = () =>
    props.toast.closeButtonAriaLabel ?? props.closeButtonAriaLabel ?? messages().close

  const defaultIcon = () => {
    const v = props.toast.variant
    if (v === 'success') {
      return 'icon-success'
    }
    if (v === 'error') {
      return 'icon-error'
    }
    if (v === 'warning') {
      return 'icon-warning'
    }
    if (v === 'info') {
      return 'icon-info'
    }
    if (v === 'loading') {
      return 'icon-loading'
    }
    return undefined
  }

  const iconSource = (): ToastT.Item['icon'] => props.toast.icon ?? defaultIcon()

  return (
    <li
      ref={(el) => {
        itemRef = el
      }}
      data-slot="toast"
      role={role()}
      tabIndex={0}
      inert={!isVisible() ? true : undefined}
      {...toastDataAttributes.root({
        front: isFront,
        behind: () => !isFront(),
        expanded: () => props.expanded,
        limited: () => !isVisible(),
        bump: isBumping,
        swiping,
        swipeOut,
      })}
      {...resolved.styles.root}
      style={{
        ...resolved.styles.root.style,
        transform: transform(),
        opacity: opacity(),
        height: height(),
        'z-index': props.toastsCount - props.index,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTransitionEnd={handleEndTransition}
      onAnimationEnd={handleEndTransition}
    >
      <Show
        when={props.toast.jsx}
        fallback={
          <>
            <Show when={iconSource()}>
              {(source) => (
                <div data-slot="toast-icon" {...resolved.styles.icon}>
                  <Icon name={source()} />
                </div>
              )}
            </Show>

            <div data-slot="toast-content" {...resolved.styles.content}>
              <Show when={props.toast.title}>
                {(title) => (
                  <div data-slot="toast-title" {...resolved.styles.title}>
                    {renderWithProps(title(), {})}
                  </div>
                )}
              </Show>
              <Show when={props.toast.description}>
                {(desc) => (
                  <div data-slot="toast-description" {...resolved.styles.description}>
                    {renderWithProps(desc(), {})}
                  </div>
                )}
              </Show>
            </div>

            <Show when={props.toast.cancel}>
              {(cancel) => (
                <Show
                  when={isActionConfig(cancel()) ? (cancel() as ToastT.Action) : undefined}
                  fallback={
                    <div data-slot="toast-cancel" {...resolved.styles.cancel}>
                      {cancel() as JSX.Element}
                    </div>
                  }
                >
                  {(config) => (
                    <Button
                      data-slot="toast-cancel"
                      slotName="toast-cancel"
                      size="sm"
                      variant="ghost"
                      {...resolved.styles.cancel}
                      class={cn(resolved.styles.cancel.class, config().class)}
                      style={{
                        ...resolved.styles.cancel.style,
                        ...config().style,
                      }}
                      onClick={(e) => {
                        config().onClick?.(e)
                        props.onDismiss(props.toast.id)
                      }}
                    >
                      {config().label}
                    </Button>
                  )}
                </Show>
              )}
            </Show>

            <Show when={props.toast.action}>
              {(action) => (
                <Show
                  when={isActionConfig(action()) ? (action() as ToastT.Action) : undefined}
                  fallback={
                    <div data-slot="toast-action" {...resolved.styles.action}>
                      {action() as JSX.Element}
                    </div>
                  }
                >
                  {(config) => (
                    <Button
                      data-slot="toast-action"
                      slotName="toast-action"
                      size="sm"
                      variant="outline"
                      {...resolved.styles.action}
                      class={cn(resolved.styles.action.class, config().class)}
                      style={{
                        ...resolved.styles.action.style,
                        ...config().style,
                      }}
                      onClick={(e) => {
                        config().onClick?.(e)
                        if (!e.defaultPrevented) {
                          props.onDismiss(props.toast.id)
                        }
                      }}
                    >
                      {config().label}
                    </Button>
                  )}
                </Show>
              )}
            </Show>

            <Show when={showCloseButton()}>
              <Button
                data-slot="toast-close"
                slotName="toast-close"
                size="icon-sm"
                variant="ghost"
                leading="icon-close"
                aria-label={closeLabel()}
                {...resolved.styles.close}
                onClick={() => {
                  props.onDismiss(props.toast.id)
                }}
              />
            </Show>

            <Show when={showProgressBar()}>
              <div data-slot="toast-progress" {...resolved.styles.progress}>
                <Progress
                  size="sm"
                  value={progressPercent()}
                  // Indicator transition would trail the timer and look unfinished at dismiss.
                  classes={{ indicator: 'transition-none' }}
                />
              </div>
            </Show>
          </>
        }
      >
        {(customJsx) => {
          const jsx = customJsx()
          return typeof jsx === 'function' ? jsx(props.toast.id) : jsx
        }}
      </Show>
    </li>
  )
}
