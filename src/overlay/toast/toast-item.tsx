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
import { renderWithProps } from '../../shared/render-with-props'
import type { OverlayAlign } from '../../theme/style-types'

import { toastDataAttributes, toastRecipe } from './toast.recipe'
import { DEFAULT_TOAST_DURATION, DEFAULT_TOAST_GAP } from './toast.types'
import type { ToastT } from './toast.types'

const SWIPE_THRESHOLD = 45
const SWIPE_MIN_DISTANCE = 12
const SWIPE_VELOCITY = 0.11
/** Fallback unmount delay; matches recipe `duration-400` (swipe-out uses 200ms via transitionend). */
const TOAST_EXIT_MS = 400

export interface ToastItemProps {
  toast: ToastT.Item
  index: number
  toastsCount: number
  visibleToasts: number
  frontmostHeight: number
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

interface ActionButtonConfig {
  label: JSX.Element
  onClick?: (event: MouseEvent) => void
  class?: ToastT.Action['class']
  style?: ToastT.Action['style']
}

function isActionConfig(value: unknown): value is ActionButtonConfig {
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
  let itemRef: HTMLLIElement | undefined
  let dragStartTime = 0
  let pointerStart: { x: number; y: number } | null = null
  let dragAxis: 'x' | 'y' | null = null
  let isDeleting = false
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
  const [swipeOut, setSwipeOut] = createSignal(false)
  const [swipeOutDirection, setSwipeOutDirection] = createSignal<
    'left' | 'right' | 'up' | 'down' | null
  >(null)
  const [offsetBeforeRemove, setOffsetBeforeRemove] = createSignal(0)
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
    if (isDeleting) {
      return
    }
    isDeleting = true
    const toastId = props.toast.id
    setRemoved(true)
    setOffsetBeforeRemove(currentYOffset())
    props.onHeight(toastId, 0)

    exitTimerId = setTimeout(finishDelete, TOAST_EXIT_MS)
  }

  const handleEndTransition = (event: Event) => {
    if (isDeleting && event.target === itemRef) {
      finishDelete()
    }
  }

  onCleanup(() => {
    if (exitTimerId) {
      clearTimeout(exitTimerId)
    }
  })

  createEffect(
    on(
      () => props.toast.dismissed,
      (dismissed) => {
        if (dismissed && !isDeleting) {
          deleteToast()
          props.toast.onDismiss?.(props.toast)
        }
      },
    ),
  )

  const transform = createMemo(() => {
    if (swipeOut()) {
      const dir = swipeOutDirection()
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
        return `translate3d(0, ${offsetBeforeRemove() + (lift() > 0 ? -100 : 100)}px, 0) scale(1)`
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
    }),
    inheritedStyles: () => ({
      classes: props.classes,
      styles: props.styles,
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

  onCleanup(() => {
    if (bumpTimerId) {
      clearTimeout(bumpTimerId)
    }
  })

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
        props.toast.onAutoClose?.(props.toast)
        props.onDismiss(props.toast.id)
      }, currentRemaining)

      if (showProgressBar()) {
        progressTimerId = setInterval(() => {
          if (closeTimerStartTime > 0) {
            const elapsed = Date.now() - closeTimerStartTime
            const left = Math.max(0, remainingTime - elapsed)
            setProgressPercent((left / initialDuration()) * 100)
          }
        }, 50)
      }
    }),
  )

  onCleanup(() => {
    if (timerId) {
      clearTimeout(timerId)
    }
    if (progressTimerId) {
      clearInterval(progressTimerId)
    }
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
      setSwipeOut(true)
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
    props.toast.closeButtonAriaLabel ?? props.closeButtonAriaLabel ?? 'Close notification'

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
      class={resolved.styles.root.class}
      style={{
        ...resolved.styles.root.style,
        [isTop() ? 'top' : 'bottom']: '0',
        ...(props.align === 'start'
          ? { left: '0' }
          : props.align === 'center'
            ? { left: '0', right: '0', margin: '0 auto' }
            : { right: '0' }),
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
                <div
                  data-slot="toast-icon"
                  class={resolved.styles.icon.class}
                  style={resolved.styles.icon.style}
                >
                  <Icon name={source()} />
                </div>
              )}
            </Show>

            <div
              data-slot="toast-content"
              class={resolved.styles.content.class}
              style={resolved.styles.content.style}
            >
              <Show when={props.toast.title}>
                {(title) => (
                  <div
                    data-slot="toast-title"
                    class={resolved.styles.title.class}
                    style={resolved.styles.title.style}
                  >
                    {renderWithProps(title(), {})}
                  </div>
                )}
              </Show>
              <Show when={props.toast.description}>
                {(desc) => (
                  <div
                    data-slot="toast-description"
                    class={resolved.styles.description.class}
                    style={resolved.styles.description.style}
                  >
                    {renderWithProps(desc(), {})}
                  </div>
                )}
              </Show>
            </div>

            <Show when={props.toast.cancel}>
              {(cancel) => (
                <Show
                  when={isActionConfig(cancel()) ? (cancel() as ActionButtonConfig) : undefined}
                  fallback={
                    <div
                      data-slot="toast-cancel"
                      class={resolved.styles.cancel.class}
                      style={resolved.styles.cancel.style}
                    >
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
                  when={isActionConfig(action()) ? (action() as ActionButtonConfig) : undefined}
                  fallback={
                    <div
                      data-slot="toast-action"
                      class={resolved.styles.action.class}
                      style={resolved.styles.action.style}
                    >
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
                class={resolved.styles.close.class}
                style={resolved.styles.close.style}
                onClick={() => {
                  props.onDismiss(props.toast.id)
                }}
              />
            </Show>

            <Show when={showProgressBar()}>
              <div
                data-slot="toast-progress"
                class={resolved.styles.progress.class}
                style={resolved.styles.progress.style}
              >
                <Progress size="sm" value={progressPercent()} />
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
