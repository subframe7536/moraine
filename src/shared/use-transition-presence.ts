import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'

import { useEventListener } from './use-event-listener.ts'

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
  animation: MotionTiming
  transition: MotionTiming
}

interface MotionTiming {
  duration: number | undefined
  eventCount: number
  names: Array<string>
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

function getMotionTiming(
  durations: string,
  delays: string,
  names: string,
  inactiveName: string,
): MotionTiming {
  const durationValues = durations.split(',').map(parseTime)
  const delayValues = delays.split(',').map(parseTime)
  const namesValues = names.split(',').map((value) => value.trim())

  return namesValues.reduce<MotionTiming>(
    (timing, name, index) => {
      if (name === inactiveName) {
        return timing
      }

      const duration = durationValues[index % durationValues.length] ?? 0
      const delay = delayValues[index % delayValues.length] ?? 0
      const total = Math.max(0, duration + delay)

      if (total === 0) {
        return timing
      }

      return {
        duration: Math.max(timing.duration ?? 0, total),
        eventCount: timing.eventCount + 1,
        names: [...timing.names, name],
      }
    },
    { duration: 0, eventCount: 0, names: [] },
  )
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
    return {
      animation: { duration: undefined, eventCount: 1, names: ['*'] },
      transition: { duration: undefined, eventCount: 1, names: ['*'] },
    }
  }

  const animation = hasMotionDurationMetadata(style, 'animation')
    ? getMotionTiming(style.animationDuration, style.animationDelay, style.animationName, 'none')
    : { duration: undefined, eventCount: 1, names: ['*'] }
  const transition = hasMotionDurationMetadata(style, 'transition')
    ? getMotionTiming(
        style.transitionDuration,
        style.transitionDelay,
        style.transitionProperty,
        'none',
      )
    : { duration: undefined, eventCount: 1, names: ['*'] }

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
  const [element, setPresenceElement] = createSignal<HTMLElement>()

  createEffect(() => {
    if (options.open()) {
      setPresent(true)
      return
    }

    if (!present()) {
      return
    }

    const currentElement = element()

    if (!currentElement) {
      setPresent(false)
      return
    }

    if (!currentElement.isConnected) {
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
    if (typeof currentElement.getAnimations === 'function') {
      const animations = currentElement.getAnimations({ subtree: false })

      if (animations.length > 0) {
        const waitForAnimations = (currentAnimations: Animation[]): void => {
          Promise.all(currentAnimations.map((animation) => animation.finished)).then(
            () => {
              if (!cancelled && !options.open()) {
                setPresent(false)
              }
            },
            () => {
              if (cancelled || options.open()) {
                return
              }

              const replacementAnimations = currentElement.getAnimations({ subtree: false })

              if (
                replacementAnimations.some(
                  (animation) => animation.pending || animation.playState !== 'finished',
                )
              ) {
                waitForAnimations(replacementAnimations)
                return
              }

              setPresent(false)
            },
          )
        }

        waitForAnimations(animations)

        onCleanup(() => {
          cancelled = true
        })

        return
      }
    }

    const motionDurations = getMotionDurations(currentElement)
    const remainingAnimationNames = [...motionDurations.animation.names]
    const remainingTransitionNames = [...motionDurations.transition.names]
    let remainingAnimationEvents = waitForAnimation ? motionDurations.animation.eventCount : 0
    let remainingTransitionEvents = waitForTransition ? motionDurations.transition.eventCount : 0

    const consumeMotionEvent = (remainingNames: Array<string>, eventName: string): boolean => {
      const wildcardIndex = remainingNames.findIndex((name) => name === '*' || name === 'all')
      const nameIndex = eventName
        ? remainingNames.indexOf(eventName)
        : remainingNames.length === 1
          ? 0
          : -1
      const index = nameIndex >= 0 ? nameIndex : wildcardIndex

      if (index < 0) {
        return false
      }

      remainingNames.splice(index, 1)
      return true
    }

    const finish = () => {
      if (
        !cancelled &&
        remainingAnimationEvents === 0 &&
        remainingTransitionEvents === 0 &&
        !options.open()
      ) {
        setPresent(false)
      }
    }

    const onAnimationEnd = (event: Event) => {
      if (cancelled || options.open() || event.target !== event.currentTarget) {
        return
      }

      if (!consumeMotionEvent(remainingAnimationNames, (event as AnimationEvent).animationName)) {
        return
      }

      remainingAnimationEvents = Math.max(0, remainingAnimationEvents - 1)
      finish()
    }

    const onTransitionEnd = (event: Event) => {
      if (cancelled || options.open() || event.target !== event.currentTarget) {
        return
      }

      if (!consumeMotionEvent(remainingTransitionNames, (event as TransitionEvent).propertyName)) {
        return
      }

      remainingTransitionEvents = Math.max(0, remainingTransitionEvents - 1)
      finish()
    }

    if (remainingAnimationEvents === 0 && remainingTransitionEvents === 0) {
      setPresent(false)
      return
    }

    if (waitForAnimation) {
      useEventListener(currentElement, 'animationend', onAnimationEnd)
      useEventListener(currentElement, 'animationcancel', onAnimationEnd)
    }

    if (waitForTransition) {
      useEventListener(currentElement, 'transitionend', onTransitionEnd)
      useEventListener(currentElement, 'transitioncancel', onTransitionEnd)
    }

    const timeoutDuration = Math.max(
      waitForAnimation ? (motionDurations.animation.duration ?? 0) : 0,
      waitForTransition ? (motionDurations.transition.duration ?? 0) : 0,
    )
    const hasUnknownMotionDuration =
      (waitForAnimation && motionDurations.animation.duration === undefined) ||
      (waitForTransition && motionDurations.transition.duration === undefined)
    const timeout = hasUnknownMotionDuration
      ? undefined
      : setTimeout(() => {
          remainingAnimationEvents = 0
          remainingTransitionEvents = 0
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

    setPresenceElement(undefined)
  })

  return {
    dataAttrs,
    present,
    setElement(nextElement) {
      setPresenceElement(() => nextElement)
    },
  }
}
