import type { Component, JSX } from 'solid-js'
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
import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { hasJsxContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import { createActionRunner } from '../base/feedback/action-runner'
import { FeedbackActionButton } from '../base/feedback/feedback-action'
import { resolveFeedbackIcon } from '../base/feedback/feedback-icons'
import type { FeedbackAction } from '../base/feedback/feedback.types'

import { resolveToastOptions } from './toast-store'
import type { ToastHostDefaults, ToastRecord, ToastStore } from './toast-store'
import { defaultToastMessages } from './toast.messages'
import { toastDataAttributes, toastRecipe, TOAST_PROGRESS_CLASS } from './toast.recipe'
import { DEFAULT_TOAST_DURATION } from './toast.types'
import type { ToastT } from './toast.types'

const SWIPE_THRESHOLD = 45
const SWIPE_MIN_DISTANCE = 12
const SWIPE_VELOCITY = 0.11
/** Matches recipe `duration-400`. Swipe-out uses `duration-200`. */
const TOAST_EXIT_MS = 400
const TOAST_SWIPE_EXIT_MS = 200

export interface ToastItemProps {
  toast: ToastRecord
  index: number
  toastsCount: number
  visibleToasts: number
  offsetY: number
  expanded: boolean
  paused?: boolean
  host: ToastHostDefaults
  store: ToastStore
  itemRender?: Component<ToastT.ItemRenderProps>
  gap: number
  onHeight: (id: ToastT.Id, height: number) => void
}

function cancelAction(value: ToastT.Options['cancel']): FeedbackAction | undefined {
  if (!value || typeof value === 'boolean') {
    return undefined
  }
  return value
}

function showsCancel(value: ToastT.Options['cancel']): boolean {
  return value !== undefined && value !== false
}

function isAwaySwipe(
  axis: 'x' | 'y',
  movedX: number,
  movedY: number,
  align: NonNullable<ToastT.Options['align']>,
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
  const messages = useMessages('toast', defaultToastMessages)
  const options = createMemo(() => resolveToastOptions(props.toast.options, props.host))
  const runner = createActionRunner({
    closed: () => Boolean(props.toast.closed),
    onFinish: (kind) => props.store.close(props.toast.id, kind),
  })
  const presentation: ToastT.ItemRenderProps = {
    get id() {
      return props.toast.id
    },
    get options() {
      return options()
    },
    pending: runner.pending,
    action: (event) => runner.run('action', event, options().action?.onClick),
    cancel: (event) => runner.run('cancel', event, cancelAction(options().cancel)?.onClick),
    close: (reason = 'dismiss') => props.store.close(props.toast.id, reason),
    update: (next) => props.store.update(props.toast.id, next),
    get index() {
      return props.index
    },
    get expanded() {
      return props.expanded
    },
  }

  let itemRef: HTMLLIElement | undefined
  let dragStartTime = 0
  let pointerStart: { x: number; y: number } | null = null
  let dragAxis: 'x' | 'y' | null = null
  let exitTimerId: ReturnType<typeof setTimeout> | undefined
  let exitNotBefore = 0
  let timerId: ReturnType<typeof setTimeout> | undefined
  let bumpTimerId: ReturnType<typeof setTimeout> | undefined
  let closeTimerStartTime = 0

  const initialDuration = () => options().duration ?? DEFAULT_TOAST_DURATION
  let remainingTime = untrack(initialDuration)

  const [mounted, setMounted] = createSignal(false)
  const [removed, setRemoved] = createSignal(false)
  const [isBumping, setIsBumping] = createSignal(false)
  const [swiping, setSwiping] = createSignal(false)
  const [swipeOffset, setSwipeOffset] = createSignal({ x: 0, y: 0 })
  const [swipeOutDirection, setSwipeOutDirection] = createSignal<
    'left' | 'right' | 'up' | 'down' | null
  >(null)
  const swipeOut = () => swipeOutDirection() !== null
  const [measuredHeight, setMeasuredHeight] = createSignal(0)
  const [progressEpoch, setProgressEpoch] = createSignal(1)

  const isFront = () => props.index === 0
  const isVisible = () => props.index < props.visibleToasts
  const isLoading = () => options().type === 'loading'
  const isTop = () => options().placement === 'top'
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
    return lift() * (props.index * props.gap)
  }
  // Closing toasts keep the pose from the last open frame. Index and z-index
  // otherwise change as soon as `closed` is set, which pulls a buried toast
  // over the front of the stack while it is fading out.
  let restFront = false
  let restExpanded = false
  let restY = 0
  let restScale = 1
  let restZ = 1
  createEffect(
    on(
      () =>
        [
          props.toast.closed,
          props.index,
          props.offsetY,
          props.expanded,
          props.toastsCount,
          props.gap,
          isTop(),
        ] as const,
      ([closed, index, offsetY, expanded, count, gap, top]) => {
        if (closed || untrack(removed)) {
          return
        }
        const liftValue = top ? 1 : -1
        restFront = index === 0
        restExpanded = expanded
        restScale = expanded || index === 0 ? 1 : Math.max(0.85, 1 - index * 0.05)
        restY = expanded ? liftValue * offsetY : liftValue * index * gap
        // Stay under the toast closer to the front after this one leaves the count.
        restZ = Math.max(0, count - index - 1)
      },
    ),
  )
  const finishDelete = () => {
    if (exitTimerId) {
      clearTimeout(exitTimerId)
      exitTimerId = undefined
    }
    props.store.remove(props.toast.id)
  }
  const deleteToast = () => {
    if (untrack(removed)) {
      return
    }
    setRemoved(true)
    props.onHeight(props.toast.id, 0)
    const exitMs = untrack(swipeOut) ? TOAST_SWIPE_EXIT_MS : TOAST_EXIT_MS
    // A stack move that is already running can finish just after close. That
    // transitionend is not the exit; wait until the exit duration has elapsed.
    exitNotBefore = performance.now() + exitMs - 48
    exitTimerId = setTimeout(finishDelete, exitMs)
  }
  const handleEndTransition = (event: Event) => {
    if (!removed() || event.target !== itemRef || event.type === 'animationend') {
      return
    }
    const elapsed = event instanceof TransitionEvent ? event.elapsedTime : 0
    if (elapsed > 0 && performance.now() < exitNotBefore) {
      return
    }
    finishDelete()
  }

  createEffect(
    on(
      () => props.toast.closed,
      (closed) => {
        if (closed && !untrack(removed)) {
          deleteToast()
        }
      },
    ),
  )

  const transform = createMemo(() => {
    const direction = swipeOutDirection()
    if (direction) {
      const offset = swipeOffset()
      if (direction === 'left') {
        return `translate3d(calc(${offset.x}px - 100%), ${currentYOffset()}px, 0) scale(${scale()})`
      }
      if (direction === 'right') {
        return `translate3d(calc(${offset.x}px + 100%), ${currentYOffset()}px, 0) scale(${scale()})`
      }
      if (direction === 'up') {
        return `translate3d(${offset.x}px, calc(${currentYOffset() + offset.y}px - 100%), 0) scale(${scale()})`
      }
      return `translate3d(${offset.x}px, calc(${currentYOffset() + offset.y}px + 100%), 0) scale(${scale()})`
    }
    if (swiping()) {
      const offset = swipeOffset()
      return `translate3d(${offset.x}px, ${currentYOffset() + offset.y}px, 0) scale(${scale()})`
    }
    if (removed()) {
      if (restFront) {
        return `translate3d(0, ${lift() * -100}%, 0) scale(1)`
      }
      if (restExpanded) {
        const exitShift = lift() > 0 ? '-100%' : '100%'
        return `translate3d(0, calc(${restY}px + ${exitShift}), 0) scale(1)`
      }
      return `translate3d(0, ${restY}px, 0) scale(${restScale})`
    }
    if (!mounted()) {
      return `translate3d(0, ${lift() * -100}%, 0) scale(1)`
    }
    return `translate3d(0, ${currentYOffset()}px, 0) scale(${scale()})`
  })

  const { slots, slotWith } = useRecipe(
    toastRecipe,
    {
      get type() {
        return options().type
      },
      get large() {
        return options().large
      },
      get invert() {
        return options().invert
      },
      get placement() {
        return options().placement
      },
      get align() {
        return options().align
      },
      get class() {
        return options().class
      },
      get style() {
        return options().style
      },
      get classes() {
        return options().classes
      },
      get styles() {
        return options().styles
      },
    },
    {
      slot: 'item',
      varsSlot: 'item',
      own: () => {
        const measured = measuredHeight()
        return {
          item: {
            style: {
              transform: transform(),
              opacity: !mounted() || removed() || !isVisible() ? 0 : 1,
              height: measured > 0 ? `${measured}px` : 'auto',
              'z-index': removed()
                ? restFront
                  ? props.toastsCount + 10
                  : restZ
                : Math.max(1, props.toastsCount - props.index),
            },
          },
        }
      },
      vars: () => ({
        '--toast-index': props.index,
        '--toast-offset-y': `${props.offsetY}px`,
        '--toast-gap': `${props.gap}px`,
      }),
    },
  )

  const measureHeight = () => {
    if (!itemRef) {
      return
    }
    const originalHeight = itemRef.style.height
    itemRef.style.height = 'auto'
    const next = itemRef.offsetHeight || itemRef.getBoundingClientRect().height
    itemRef.style.height = originalHeight
    if (next > 0) {
      setMeasuredHeight(next)
      props.onHeight(props.toast.id, next)
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
        () => options().title,
        () => options().description,
        () => options().action,
        () => options().cancel,
        () => options().large,
        () => props.toast.render,
      ],
      () => {
        queueMicrotask(measureHeight)
      },
      { defer: true },
    ),
  )

  const stopTimer = () => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = undefined
    }
  }
  const isPaused = () =>
    isLoading() ||
    initialDuration() === Number.POSITIVE_INFINITY ||
    Boolean(props.paused) ||
    swiping() ||
    runner.pending() !== undefined

  const startTimer = () => {
    stopTimer()
    if (isPaused()) {
      return
    }
    closeTimerStartTime = Date.now()
    if (remainingTime <= 0) {
      props.store.close(props.toast.id, 'timeout')
      return
    }
    timerId = setTimeout(() => {
      stopTimer()
      props.store.close(props.toast.id, 'timeout')
    }, remainingTime)
  }
  const resetCloseTimer = () => {
    remainingTime = untrack(initialDuration)
    closeTimerStartTime = 0
    setProgressEpoch((prev) => prev + 1)
  }
  const handleBump = () => {
    if (bumpTimerId) {
      clearTimeout(bumpTimerId)
    }
    setIsBumping(false)
    // oxlint-disable-next-line subf/solid-reactivity -- Bump animation reads the latest duration after this paint.
    queueMicrotask(() => {
      setIsBumping(true)
      resetCloseTimer()
      startTimer()
      bumpTimerId = setTimeout(() => {
        setIsBumping(false)
        bumpTimerId = undefined
      }, 240)
    })
  }

  onMount(() => {
    // oxlint-disable-next-line subf/solid-reactivity -- The bump listener reads the latest timer state when another toast updates.
    const unsubscribe = props.store.onBump((id) => {
      if (id === props.toast.id) {
        handleBump()
      }
    })
    onCleanup(() => unsubscribe())
  })

  createEffect(
    on(
      initialDuration,
      () => {
        resetCloseTimer()
        startTimer()
      },
      { defer: true },
    ),
  )
  createEffect(
    on(isPaused, (paused) => {
      if (paused) {
        if (closeTimerStartTime > 0) {
          const elapsed = Date.now() - closeTimerStartTime
          remainingTime = Math.max(0, remainingTime - elapsed)
          closeTimerStartTime = 0
        }
        stopTimer()
      } else {
        startTimer()
      }
    }),
  )
  onCleanup(() => {
    clearTimeout(exitTimerId)
    clearTimeout(timerId)
    if (bumpTimerId) {
      clearTimeout(bumpTimerId)
    }
  })

  function handlePointerDown(event: PointerEvent) {
    if (event.button === 2 || isLoading()) {
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
    if (!pointerStart) {
      return
    }
    if (window.getSelection()?.toString().length) {
      return
    }
    const xDelta = event.clientX - pointerStart.x
    const yDelta = event.clientY - pointerStart.y
    if (!dragAxis && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
      dragAxis = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y'
    }
    const getDampening = (delta: number) => 1 / (1.5 + Math.abs(delta) / 20)
    if (dragAxis === 'x') {
      const align = options().align ?? 'end'
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
      } catch {
        // The pointer may already have been released.
      }
    }
    const timeTaken = Math.max(Date.now() - dragStartTime, 1)
    const offset = swipeOffset()
    const movedX = offset.x
    const movedY = offset.y
    const primaryDistance = dragAxis === 'y' ? Math.abs(movedY) : Math.abs(movedX)
    const velocity = primaryDistance / timeTaken
    const align = options().align ?? 'end'
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
      props.store.close(props.toast.id, 'dismiss')
      return
    }
    setSwiping(false)
    dragAxis = null
    setSwipeOffset({ x: 0, y: 0 })
  }

  const title = createMemo(() => options().title)
  const description = createMemo(() => options().description)
  const icon = createMemo(() => resolveFeedbackIcon({ type: options().type, icon: options().icon }))

  return (
    <li
      ref={(element) => {
        itemRef = element
      }}
      data-slot="toast-item"
      role={options().type === 'error' ? 'alert' : 'status'}
      tabIndex={0}
      inert={!isVisible() ? true : undefined}
      {...toastDataAttributes.item({
        front: isFront,
        behind: () => !isFront(),
        expanded: () => props.expanded,
        limited: () => !isVisible(),
        bump: isBumping,
        swiping,
        swipeOut,
        closed: () => props.toast.closed || removed(),
      })}
      {...slots.item}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTransitionEnd={handleEndTransition}
      onAnimationEnd={handleEndTransition}
    >
      <Show
        when={props.toast.render ?? props.itemRender}
        keyed
        fallback={
          <>
            <Show when={icon()}>
              {(source) => (
                <div data-slot="toast-icon" {...slots.icon}>
                  <Icon name={source()} />
                </div>
              )}
            </Show>
            <div data-slot="toast-wrapper" {...slots.wrapper}>
              <Show when={hasJsxContent(title())}>
                <div data-slot="toast-title" {...slots.title}>
                  {title()}
                </div>
              </Show>
              <Show when={hasJsxContent(description())}>
                <div data-slot="toast-description" {...slots.description}>
                  {description()}
                </div>
              </Show>
            </div>
            <Show when={showsCancel(options().cancel) || options().action}>
              <div data-slot="toast-actions" {...slots.actions}>
                <Show when={showsCancel(options().cancel)}>
                  <FeedbackActionButton
                    action={cancelAction(options().cancel)}
                    label={messages().cancel}
                    variant="soft"
                    tone="neutral"
                    size="sm"
                    loading={runner.pending() === 'cancel'}
                    disabled={runner.pending() === 'action'}
                    slotName="toast-cancel"
                    {...slotWith('cancel', () => ({
                      class: cancelAction(options().cancel)?.class,
                      style: cancelAction(options().cancel)?.style,
                    }))}
                    onClick={(event) => presentation.cancel(event)}
                  />
                </Show>
                <Show when={options().action}>
                  <FeedbackActionButton
                    action={options().action}
                    label={options().action?.label}
                    variant="solid"
                    tone="primary"
                    size="sm"
                    loading={runner.pending() === 'action'}
                    disabled={runner.pending() === 'cancel'}
                    slotName="toast-action"
                    {...slotWith('action', () => ({
                      class: options().action?.class,
                      style: options().action?.style,
                    }))}
                    onClick={(event) => presentation.action(event)}
                  />
                </Show>
              </div>
            </Show>
            <Show when={options().closable && !isLoading()}>
              <Button
                data-slot="toast-close"
                slotName="toast-close"
                size="icon-md"
                variant="ghost"
                tone="neutral"
                leading="icon-close"
                aria-label={messages().close}
                {...slots.close}
                onClick={() => presentation.close('dismiss')}
              />
            </Show>
            <Show when={options().progress && !isLoading()}>
              <div data-slot="toast-progress" {...slots.progress}>
                <Show when={progressEpoch()} keyed>
                  {(_epoch) => (
                    <div
                      data-slot="toast-progress-indicator"
                      class={TOAST_PROGRESS_CLASS}
                      style={{
                        'animation-duration': `${initialDuration()}ms`,
                        'animation-play-state': isPaused() ? 'paused' : 'running',
                      }}
                    />
                  )}
                </Show>
              </div>
            </Show>
          </>
        }
      >
        {(render) => renderWithProps(render, presentation)}
      </Show>
    </li>
  )
}
