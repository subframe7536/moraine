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

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import { Button } from '../button'
import { Icon } from '../icon'
import { createActionRunner } from '../shared/overlay/feedback/action-runner'
import { FeedbackActionButton } from '../shared/overlay/feedback/feedback-action'
import { resolveFeedbackIcon } from '../shared/overlay/feedback/feedback-icons'
import type { FeedbackAction } from '../shared/overlay/feedback/feedback.types'

import { resolveToastOptions } from './toast-store'
import type { ToastHostDefaults, ToastRecord, ToastStore } from './toast-store'
import { createToastSwipe, TOAST_SWIPE_EXIT_MS } from './toast-swipe'
import { createToastTimer } from './toast-timer'
import { defaultToastMessages } from './toast.messages'
import { toastDataAttributes, toastRecipe, TOAST_PROGRESS_CLASS } from './toast.recipe'
import type { ToastT } from './toast.types'

/** Matches recipe `duration-400`. Swipe-out uses `duration-200`. */
const TOAST_EXIT_MS = 400

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

export function ToastItem(props: ToastItemProps): JSX.Element {
  const options = createMemo(() => resolveToastOptions(props.toast.options, props.host))
  const messages = useMessages('toast', defaultToastMessages, () => options().translations)
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
  let exitTimerId: ReturnType<typeof setTimeout> | undefined
  let exitNotBefore = 0

  const [mounted, setMounted] = createSignal(false)
  const [removed, setRemoved] = createSignal(false)
  const [measuredHeight, setMeasuredHeight] = createSignal(0)

  const isFront = () => props.index === 0
  const isVisible = () => props.index < props.visibleToasts
  const isLoading = () => options().type === 'loading'
  const isTop = () => options().placement === 'top'
  const lift = () => (isTop() ? 1 : -1)

  const swipe = createToastSwipe({
    element: () => itemRef,
    align: () => options().align ?? 'end',
    isTop,
    isLoading,
    onDismiss: () => props.store.close(props.toast.id, 'dismiss'),
  })

  const timer = createToastTimer({
    toast: () => props.toast,
    options,
    paused: () => Boolean(props.paused),
    swiping: swipe.swiping,
    running: () => runner.pending() !== undefined,
    isLoading,
    onTimeout: () => props.store.close(props.toast.id, 'timeout'),
  })

  // Snapshot the last open pose when closing so exit animations smoothly fade out in place
  let restFront = false
  let restExpanded = false
  let restY = 0
  let restScale = 1
  let restZ = 1

  const scale = () => {
    if (removed()) {
      return restScale
    }
    if (props.expanded || isFront()) {
      return 1
    }
    return Math.max(0.85, 1 - props.index * 0.05)
  }

  const currentYOffset = () => {
    if (removed()) {
      return restY
    }
    if (props.expanded) {
      return lift() * props.offsetY
    }
    return lift() * (props.index * props.gap)
  }

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
    const index = props.index
    const top = isTop()
    const liftValue = top ? 1 : -1
    restFront = index === 0
    restExpanded = props.expanded
    restScale = props.expanded || index === 0 ? 1 : Math.max(0.85, 1 - index * 0.05)
    restY = props.expanded ? liftValue * props.offsetY : liftValue * index * props.gap
    restZ = Math.max(0, props.toastsCount - index - 1)

    setRemoved(true)
    props.onHeight(props.toast.id, 0)
    const exitMs = untrack(swipe.swipeOut) ? TOAST_SWIPE_EXIT_MS : TOAST_EXIT_MS
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

  onCleanup(() => {
    if (exitTimerId) {
      clearTimeout(exitTimerId)
    }
  })

  const transform = createMemo(() => {
    const direction = swipe.swipeOutDirection()
    if (direction) {
      const offset = swipe.swipeOffset()
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
    if (swipe.swiping()) {
      const offset = swipe.swipeOffset()
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

  const {
    slots: {
      item: itemSlot,
      icon: iconSlot,
      wrapper: wrapperSlot,
      title: titleSlot,
      description: descriptionSlot,
      actions: actionsSlot,
      close: closeSlot,
      progress: progressSlot,
    },
    slotWith,
  } = useRecipe(
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
      data: {
        item: toastDataAttributes.item(() => ({
          front: isFront,
          behind: () => !isFront(),
          expanded: () => props.expanded,
          limited: () => !isVisible(),
          bump: timer.isBumping,
          swiping: swipe.swiping,
          swipeOut: swipe.swipeOut,
          closed: () => props.toast.closed || removed(),
        })),
      },
      enforced: {
        item: () => {
          const measured = measuredHeight()
          return {
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
          }
        },
      },
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

  const title = createMemo(() => options().title)
  const description = createMemo(() => options().description)
  const icon = createMemo(() => resolveFeedbackIcon({ type: options().type, icon: options().icon }))

  const cancelSlot = slotWith('cancel', {
    own: () => ({
      class: cancelAction(options().cancel)?.class,
      style: cancelAction(options().cancel)?.style,
    }),
  })
  const actionSlot = slotWith('action', {
    own: () => ({
      class: options().action?.class,
      style: options().action?.style,
    }),
  })

  return (
    <li
      ref={(element) => {
        itemRef = element
      }}
      data-slot="toast-item"
      role={options().type === 'error' ? 'alert' : 'status'}
      tabIndex={0}
      inert={!isVisible() ? true : undefined}
      {...itemSlot}
      onPointerDown={swipe.handlePointerDown}
      onPointerMove={swipe.handlePointerMove}
      onPointerUp={swipe.handlePointerUp}
      onPointerCancel={swipe.handlePointerCancel}
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
                <div data-slot="toast-icon" {...iconSlot}>
                  <Icon name={source()} />
                </div>
              )}
            </Show>
            <div data-slot="toast-wrapper" {...wrapperSlot}>
              <Show when={hasContent(title())}>
                <div data-slot="toast-title" {...titleSlot}>
                  {title()}
                </div>
              </Show>
              <Show when={hasContent(description())}>
                <div data-slot="toast-description" {...descriptionSlot}>
                  {description()}
                </div>
              </Show>
            </div>
            <Show when={showsCancel(options().cancel) || options().action}>
              <div data-slot="toast-actions" {...actionsSlot}>
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
                    {...cancelSlot}
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
                    {...actionSlot}
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
                {...closeSlot}
                onClick={() => presentation.close('dismiss')}
              />
            </Show>
            <Show when={options().progress && !isLoading()}>
              <div data-slot="toast-progress" {...progressSlot}>
                <Show when={timer.progressEpoch()} keyed>
                  {(_epoch) => (
                    <div
                      data-slot="toast-progress-indicator"
                      class={TOAST_PROGRESS_CLASS}
                      style={{
                        'animation-duration': `${timer.initialDuration()}ms`,
                        'animation-play-state': timer.isPaused() ? 'paused' : 'running',
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
