import type { Accessor, JSX } from 'solid-js'
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
import { createStyles } from '../../provider'
import type { OverlayAlign, OverlayPlacement } from '../../theme/style-types'

import { toasterRecipe, toastItemDataAttributes } from './toaster.recipe'
import type { ToasterT } from './toaster.types'

const SWIPE_THRESHOLD = 45

export interface ToastItemProps {
  toast: ToasterT.Item
  index: number
  toastsCount: number
  visibleToasts: number
  frontmostHeight: number
  offsetY: number
  expanded: boolean
  isHovered: Accessor<boolean>
  isInteracting: Accessor<boolean>
  isWindowFocused: Accessor<boolean>
  isDocumentHidden: Accessor<boolean>
  placement?: OverlayPlacement
  align?: OverlayAlign
  closeButton?: boolean
  closeButtonAriaLabel?: string
  showProgress?: boolean
  invert?: boolean
  gap?: number
  duration?: number
  onHeight: (id: string | number, height: number) => void
  onDismiss: (id: string | number) => void
  onRemove: (id: string | number) => void
}

export function ToastItem(props: ToastItemProps): JSX.Element {
  let itemRef: HTMLLIElement | undefined
  let dragStartTime = 0
  let timerId: ReturnType<typeof setTimeout> | undefined
  let progressTimerId: ReturnType<typeof setInterval> | undefined
  let bumpTimerId: ReturnType<typeof setTimeout> | undefined
  let closeTimerStartTime = 0
  let pointerStart: { x: number; y: number } | null = null
  let isDeleting = false

  const initialDuration = () => props.toast.duration ?? props.duration ?? 4000
  let remainingTime = untrack(() => props.toast.duration ?? props.duration ?? 4000)

  const [mounted, setMounted] = createSignal(false)
  const [removed, setRemoved] = createSignal(false)
  const [swiping, setSwiping] = createSignal(false)
  const [swipeOut, setSwipeOut] = createSignal(false)
  const [swipeDirection, setSwipeDirection] = createSignal<'x' | 'y' | null>(null)
  const [swipeOutDirection, setSwipeOutDirection] = createSignal<
    'left' | 'right' | 'up' | 'down' | null
  >(null)
  const [swipeMovementX, setSwipeMovementX] = createSignal(0)
  const [swipeMovementY, setSwipeMovementY] = createSignal(0)
  const [offsetBeforeRemove, setOffsetBeforeRemove] = createSignal(0)
  const [isBumping, setIsBumping] = createSignal(false)
  const [measuredHeight, setMeasuredHeight] = createSignal(0)
  const [progressPercent, setProgressPercent] = createSignal(100)

  const isFront = () => props.index === 0
  const isVisible = () => props.index < props.visibleToasts
  const isDismissible = () => props.toast.dismissible !== false
  const isLoading = () => props.toast.variant === 'loading'

  const isTop = () => {
    const p = props.toast.placement ?? props.placement ?? 'bottom'
    const a = props.toast.align ?? props.align ?? 'end'
    return p === 'top' || ((p === 'left' || p === 'right') && a === 'start')
  }

  const lift = () => (isTop() ? 1 : -1)

  const scale = createMemo(() => {
    if (props.expanded || isFront()) {
      return 1
    }
    return Math.max(0.85, 1 - props.index * 0.05)
  })

  const currentYOffset = createMemo(() => {
    if (props.expanded) {
      return lift() * props.offsetY
    }
    return lift() * (props.index * 12)
  })

  const deleteToast = () => {
    if (isDeleting) {
      return
    }
    isDeleting = true
    const toastId = props.toast.id
    const onRemove = props.onRemove
    setRemoved(true)
    setOffsetBeforeRemove(currentYOffset())
    props.onHeight(toastId, 0)
    let cleanedUp = false
    const finish = () => {
      if (cleanedUp) {
        return
      }
      cleanedUp = true
      onRemove(toastId)
    }

    const timer = window.setTimeout(finish, 200)

    if (itemRef) {
      const onEnd = (event: Event) => {
        if (event.target === itemRef) {
          clearTimeout(timer)
          itemRef?.removeEventListener('transitionend', onEnd)
          itemRef?.removeEventListener('animationend', onEnd)
          finish()
        }
      }
      itemRef.addEventListener('transitionend', onEnd)
      itemRef.addEventListener('animationend', onEnd)
    }
  }

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
      if (dir === 'left') {
        return `translate3d(calc(${swipeMovementX()}px - 100%), ${currentYOffset()}px, 0) scale(${scale()})`
      }
      if (dir === 'right') {
        return `translate3d(calc(${swipeMovementX()}px + 100%), ${currentYOffset()}px, 0) scale(${scale()})`
      }
      if (dir === 'up') {
        return `translate3d(${swipeMovementX()}px, calc(${currentYOffset() + swipeMovementY()}px - 100%), 0) scale(${scale()})`
      }
      if (dir === 'down') {
        return `translate3d(${swipeMovementX()}px, calc(${currentYOffset() + swipeMovementY()}px + 100%), 0) scale(${scale()})`
      }
    }

    if (swiping()) {
      const x = swipeMovementX()
      const y = currentYOffset() + swipeMovementY()
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

    return `translate3d(0, ${lift() * (props.index * 12)}px, 0) scale(${scale()})`
  })

  const opacity = createMemo(() => {
    if (!mounted() || removed() || !isVisible()) {
      return 0
    }
    return 1
  })

  const height = createMemo(() => {
    if (props.expanded) {
      return measuredHeight() > 0 ? `${measuredHeight()}px` : 'auto'
    }
    if (isFront()) {
      return 'auto'
    }
    return `${props.frontmostHeight}px`
  })

  const transitionStyle = () => {
    if (swiping()) {
      return 'none'
    }
    if (swipeOut()) {
      return 'transform 200ms ease-out, opacity 200ms ease-out'
    }
    return 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), height 400ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms'
  }

  // oxlint-disable-next-line subf/solid-reactivity -- Toast item styling binds to the stable toast instance.
  const resolved = createStyles(toasterRecipe, props.toast, {
    variables: () => ({
      '--toast-index': props.index,
      '--toast-offset-y': `${props.offsetY}px`,
      '--toast-height': `${measuredHeight()}px`,
      '--toast-frontmost-height': `${props.frontmostHeight}px`,
      '--toast-swipe-movement-x': `${swipeMovementX()}px`,
      '--toast-swipe-movement-y': `${swipeMovementY()}px`,
      '--toast-scale': scale(),
    }),
  })

  // Height measurement
  const measureHeight = () => {
    if (itemRef) {
      const h = itemRef.offsetHeight || itemRef.getBoundingClientRect().height
      if (h > 0) {
        setMeasuredHeight(h)
        props.onHeight(props.toast.id, h)
      }
    }
  }

  onMount(() => {
    measureHeight()
    setMounted(true)
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
    ),
  )

  // Bump pulse animation on bumpKey update
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

  // Timer logic
  const isPaused = createMemo(
    () =>
      isLoading() ||
      initialDuration() === Number.POSITIVE_INFINITY ||
      props.expanded ||
      props.isHovered() ||
      props.isInteracting() ||
      swiping() ||
      props.isDocumentHidden() ||
      !props.isWindowFocused(),
  )

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
        deleteToast()
        return
      }

      timerId = setTimeout(() => {
        props.toast.onAutoClose?.(props.toast)
        deleteToast()
      }, currentRemaining)

      // Update progress bar
      if (props.showProgress || props.toast.showProgress) {
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

  // Swipe gesture handling
  function handlePointerDown(event: PointerEvent) {
    if (event.button === 2 || isLoading() || !isDismissible()) {
      return
    }

    const targetEl = event.target as HTMLElement | null
    if (targetEl?.closest('button, a, input, textarea, select, [data-swipe-ignore]')) {
      return
    }

    dragStartTime = Date.now()
    targetEl?.setPointerCapture?.(event.pointerId)
    setSwiping(true)
    pointerStart = { x: event.clientX, y: event.clientY }
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

    if (!swipeDirection() && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
      setSwipeDirection(Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y')
    }

    const getDampening = (delta: number) => 1 / (1.5 + Math.abs(delta) / 20)

    if (swipeDirection() === 'x') {
      const align = props.toast.align ?? props.align ?? 'end'
      let movement = xDelta
      if (align === 'end' && xDelta < 0) {
        movement = xDelta * getDampening(xDelta)
      } else if (align === 'start' && xDelta > 0) {
        movement = xDelta * getDampening(xDelta)
      }
      setSwipeMovementX(movement)
      setSwipeMovementY(0)
    } else if (swipeDirection() === 'y') {
      let movement = yDelta
      if (isTop() && yDelta > 0) {
        movement = yDelta * getDampening(yDelta)
      } else if (!isTop() && yDelta < 0) {
        movement = yDelta * getDampening(yDelta)
      }
      setSwipeMovementY(movement)
      setSwipeMovementX(0)
    }
  }

  function handlePointerUp() {
    if (!pointerStart || swipeOut()) {
      return
    }

    const timeTaken = Math.max(Date.now() - dragStartTime, 1)
    const movedX = swipeMovementX()
    const movedY = swipeMovementY()
    const primaryDistance = swipeDirection() === 'y' ? Math.abs(movedY) : Math.abs(movedX)
    const velocity = primaryDistance / timeTaken

    pointerStart = null

    if (primaryDistance >= SWIPE_THRESHOLD || velocity > 0.11) {
      if (swipeDirection() === 'x') {
        setSwipeOutDirection(movedX > 0 ? 'right' : 'left')
      } else {
        setSwipeOutDirection(movedY > 0 ? 'down' : 'up')
      }
      setSwipeOut(true)
      props.toast.onDismiss?.(props.toast)
      deleteToast()
      return
    }

    setSwiping(false)
    setSwipeDirection(null)
    setSwipeMovementX(0)
    setSwipeMovementY(0)
  }

  const role = () => props.toast.role ?? (props.toast.variant === 'error' ? 'alert' : 'status')
  const ariaLive = () => (props.toast.variant === 'error' ? 'assertive' : 'polite')

  const showCloseButton = () =>
    (props.toast.closeButton ?? props.closeButton ?? false) && !isLoading()

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

  const renderIcon = () => {
    if (props.toast.icon) {
      return typeof props.toast.icon === 'function' ? props.toast.icon() : props.toast.icon
    }
    const name = defaultIcon()
    if (name) {
      return <Icon name={name} class={name === 'icon-loading' ? 'animate-spin' : undefined} />
    }
    return null
  }

  const renderTitle = () => {
    const t = props.toast.title
    return typeof t === 'function' ? t() : t
  }

  const renderDescription = () => {
    const d = props.toast.description
    return typeof d === 'function' ? d() : d
  }

  const itemDataAttrs = toastItemDataAttributes({
    index: () => props.index,
    front: isFront,
    behind: () => !isFront(),
    mounted,
    removed,
    expanded: () => props.expanded,
    limited: () => !isVisible(),
    swiping,
    swipeOut,
    swipeDirection: swipeOutDirection,
    bump: isBumping,
    type: () => props.toast.variant ?? 'default',
    dismissible: isDismissible,
  })

  return (
    <li
      ref={(el) => {
        itemRef = el
      }}
      data-slot="toast"
      role={role()}
      aria-live={ariaLive()}
      aria-atomic="true"
      tabIndex={0}
      inert={!isVisible() ? true : undefined}
      {...itemDataAttrs}
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
        transition: transitionStyle(),
        'z-index': props.toastsCount - props.index,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <Show
        when={props.toast.jsx}
        fallback={
          <>
            <Show when={renderIcon()}>
              {(iconContent) => (
                <div class={resolved.styles.icon.class} style={resolved.styles.icon.style}>
                  {iconContent()}
                </div>
              )}
            </Show>

            <div class={resolved.styles.content.class} style={resolved.styles.content.style}>
              <Show when={renderTitle()}>
                <div class={resolved.styles.title.class} style={resolved.styles.title.style}>
                  {renderTitle()}
                </div>
              </Show>
              <Show when={renderDescription()}>
                <div
                  class={resolved.styles.description.class}
                  style={resolved.styles.description.style}
                >
                  {renderDescription()}
                </div>
              </Show>
            </div>

            <Show when={props.toast.cancel}>
              {(cancel) => {
                const c = cancel()
                return typeof c === 'object' &&
                  c !== null &&
                  'label' in c &&
                  typeof (c as any).label !== 'undefined' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    class={resolved.styles.cancel.class}
                    style={resolved.styles.cancel.style}
                    onClick={(e) => {
                      ;(c as any).onClick?.(e)
                      deleteToast()
                      props.toast.onDismiss?.(props.toast)
                    }}
                  >
                    {(c as any).label}
                  </Button>
                ) : (
                  (c as JSX.Element)
                )
              }}
            </Show>

            <Show when={props.toast.action}>
              {(action) => {
                const a = action()
                return typeof a === 'object' &&
                  a !== null &&
                  'label' in a &&
                  typeof (a as any).label !== 'undefined' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    class={resolved.styles.action.class}
                    style={resolved.styles.action.style}
                    onClick={(e) => {
                      ;(a as any).onClick?.(e)
                      if (!e.defaultPrevented) {
                        deleteToast()
                        props.toast.onDismiss?.(props.toast)
                      }
                    }}
                  >
                    {(a as any).label}
                  </Button>
                ) : (
                  (a as JSX.Element)
                )
              }}
            </Show>

            <Show when={showCloseButton()}>
              <Button
                size="icon-sm"
                variant="ghost"
                leading="icon-close"
                aria-label={props.closeButtonAriaLabel ?? 'Close notification'}
                class={resolved.styles.close.class}
                style={resolved.styles.close.style}
                onClick={() => {
                  deleteToast()
                  props.toast.onDismiss?.(props.toast)
                }}
              />
            </Show>

            <Show when={props.showProgress || props.toast.showProgress}>
              <div class={resolved.styles.progress.class} style={resolved.styles.progress.style}>
                <Progress size="sm" value={progressPercent()} />
              </div>
            </Show>
          </>
        }
      >
        {(customJsx) => {
          const jsx = customJsx()
          return typeof jsx === 'function' ? (jsx as any)(props.toast.id) : jsx
        }}
      </Show>
    </li>
  )
}
