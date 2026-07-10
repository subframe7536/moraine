import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'

import { useEventListener } from './use-event-listener'

export type TransitionPresenceMotion = 'animation' | 'transition' | 'both' | 'none'

export interface UseTransitionPresenceOptions {
  open: Accessor<boolean>
  mode?: TransitionPresenceMotion
}

export interface TransitionPresenceState {
  dataAttrs: Accessor<{
    'data-closed'?: string
    'data-expanded'?: string
  }>
  present: Accessor<boolean>
  setElement: (element: HTMLElement | undefined) => void
}

interface MotionDurations {
  animation: number | undefined
  transition: number | undefined
}

function parseTime(value: string): number {
  const trimmed = value.trim()

  if (trimmed.endsWith('ms')) {
    return Number.parseFloat(trimmed) || 0
  }

  if (trimmed.endsWith('s')) {
    return (Number.parseFloat(trimmed) || 0) * 1000
  }

  return 0
}

function getMaximumMotionDuration(
  durations: string,
  delays: string,
  names: string,
  inactiveName: string,
): number {
  const durationValues = durations.split(',').map(parseTime)
  const delayValues = delays.split(',').map(parseTime)
  const namesValues = names.split(',').map((value) => value.trim())

  return durationValues.reduce((maximum, duration, index) => {
    if (namesValues[index % namesValues.length] === inactiveName) {
      return maximum
    }

    return Math.max(maximum, duration + (delayValues[index % delayValues.length] ?? 0))
  }, 0)
}

function hasMotionDurationMetadata(
  style: CSSStyleDeclaration,
  kind: 'animation' | 'transition',
): boolean {
  if (kind === 'animation') {
    return Boolean(style.animationDelay && style.animationDuration && style.animationName)
  }

  return Boolean(style.transitionDelay && style.transitionDuration && style.transitionProperty)
}

function getMotionDurations(element: HTMLElement): MotionDurations {
  const style = getComputedStyle(element)

  // Some non-browser DOM implementations cannot resolve animation timing and
  // expose the nonstandard `auto` default. Keep the event fallback available
  // when timing metadata is unavailable instead of treating it as no motion.
  if (style.animationDuration === 'auto') {
    return { animation: undefined, transition: undefined }
  }

  const animation = hasMotionDurationMetadata(style, 'animation')
    ? getMaximumMotionDuration(
        style.animationDuration,
        style.animationDelay,
        style.animationName,
        'none',
      )
    : undefined
  const transition = hasMotionDurationMetadata(style, 'transition')
    ? getMaximumMotionDuration(
        style.transitionDuration,
        style.transitionDelay,
        style.transitionProperty,
        'none',
      )
    : undefined

  return { animation, transition }
}

/**
 * Keeps a disclosure element mounted until its exit motion fully settles.
 */
export function useTransitionPresence(
  options: UseTransitionPresenceOptions,
): TransitionPresenceState {
  const [present, setPresent] = createSignal(Boolean(options.open()))
  const dataAttrs = createMemo(() => {
    if (options.open()) {
      return { 'data-expanded': '' }
    }

    return { 'data-closed': '' }
  })

  let element: HTMLElement | undefined

  createEffect(() => {
    if (options.open()) {
      setPresent(true)
      return
    }

    if (!present()) {
      return
    }

    if (!element) {
      setPresent(false)
      return
    }

    const mode = options.mode ?? 'both'

    if (mode === 'none') {
      setPresent(false)
      return
    }

    const waitForAnimation = mode === 'animation' || mode === 'both'
    const waitForTransition = mode === 'transition' || mode === 'both'

    let cancelled = false
    let animationEnded = !waitForAnimation
    let transitionEnded = !waitForTransition

    const finish = () => {
      if (!cancelled && animationEnded && transitionEnded && !options.open()) {
        setPresent(false)
      }
    }

    const onAnimationEnd = (event: Event) => {
      if (cancelled || options.open() || event.target !== event.currentTarget) {
        return
      }

      animationEnded = true
      finish()
    }

    const onTransitionEnd = (event: Event) => {
      if (cancelled || options.open() || event.target !== event.currentTarget) {
        return
      }

      transitionEnded = true
      finish()
    }

    if (typeof element.getAnimations === 'function') {
      const animations = element.getAnimations({ subtree: false })

      if (animations.length > 0) {
        Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
          if (!cancelled && !options.open()) {
            setPresent(false)
          }
        })

        onCleanup(() => {
          cancelled = true
        })

        return
      }
    }

    const motionDurations = getMotionDurations(element)
    animationEnded ||= motionDurations.animation === 0
    transitionEnded ||= motionDurations.transition === 0

    if (animationEnded && transitionEnded) {
      setPresent(false)
      return
    }

    if (waitForAnimation) {
      useEventListener(element, 'animationend', onAnimationEnd)
    }

    if (waitForTransition) {
      useEventListener(element, 'transitionend', onTransitionEnd)
    }

    const timeoutDuration = Math.max(
      waitForAnimation ? (motionDurations.animation ?? 0) : 0,
      waitForTransition ? (motionDurations.transition ?? 0) : 0,
    )
    const hasUnknownMotionDuration =
      (waitForAnimation && motionDurations.animation === undefined) ||
      (waitForTransition && motionDurations.transition === undefined)
    const timeout = hasUnknownMotionDuration
      ? undefined
      : setTimeout(() => {
          animationEnded = true
          transitionEnded = true
          finish()
        }, timeoutDuration)

    onCleanup(() => {
      cancelled = true
      if (timeout !== undefined) {
        clearTimeout(timeout)
      }
    })
  })

  createEffect(() => {
    if (present()) {
      return
    }

    element = undefined
  })

  return {
    dataAttrs,
    present,
    setElement(nextElement) {
      element = nextElement
    },
  }
}
