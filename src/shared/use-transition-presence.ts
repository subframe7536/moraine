import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'

import { attachEventListener } from './use-event-listener.ts'

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
  registerElement: (element: HTMLElement) => () => void
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

interface MotionWait {
  cancel: () => void
}

type WebAnimation = Animation & {
  animationName?: string
  transitionProperty?: string
}

function isRelevantWebAnimation(animation: Animation, mode: TransitionPresenceMotion): boolean {
  if (mode === 'both') {
    return true
  }

  const candidate = animation as WebAnimation
  const isAnimation = typeof candidate.animationName === 'string'
  const isTransition = typeof candidate.transitionProperty === 'string'

  // Script-created animations do not identify themselves as CSS animations or
  // transitions. Keep them relevant for either single-kind mode, matching the
  // legacy Web Animations behavior.
  if (!isAnimation && !isTransition) {
    return true
  }

  return mode === 'animation' ? isAnimation : isTransition
}

function getWebAnimations(
  element: HTMLElement,
  mode: TransitionPresenceMotion,
): Animation[] | undefined {
  if (typeof element.getAnimations !== 'function') {
    return undefined
  }

  return element
    .getAnimations({ subtree: false })
    .filter((animation) => isRelevantWebAnimation(animation, mode))
}

function waitForElementMotion(
  element: HTMLElement,
  mode: TransitionPresenceMotion,
  onSettled: () => void,
): MotionWait | null {
  let cancelled = false
  let settled = false
  const cleanups: Array<() => void> = []

  const cleanup = (): void => {
    for (const remove of cleanups.splice(0)) {
      remove()
    }
  }

  const settle = (): void => {
    if (settled) {
      return
    }

    settled = true
    cleanup()
    onSettled()
  }

  const cancel = (): void => {
    cancelled = true
    settle()
  }

  const webAnimations = getWebAnimations(element, mode)
  if (webAnimations && webAnimations.length > 0) {
    const waitForAnimations = (animations: Animation[]): void => {
      if (cancelled) {
        return
      }

      Promise.all(animations.map((animation) => animation.finished)).then(
        () => {
          if (!cancelled) {
            settle()
          }
        },
        () => {
          if (cancelled) {
            return
          }

          queueMicrotask(() => {
            if (cancelled) {
              return
            }

            const replacementAnimations = getWebAnimations(element, mode)
            if (replacementAnimations && replacementAnimations.length > 0) {
              waitForAnimations(replacementAnimations)
            } else {
              settle()
            }
          })
        },
      )
    }

    waitForAnimations(webAnimations)
    return { cancel }
  }

  const motionDurations = getMotionDurations(element)
  const remainingAnimationNames = [...motionDurations.animation.names]
  const remainingTransitionNames = [...motionDurations.transition.names]
  let remainingAnimationEvents =
    mode === 'animation' || mode === 'both' ? motionDurations.animation.eventCount : 0
  let remainingTransitionEvents =
    mode === 'transition' || mode === 'both' ? motionDurations.transition.eventCount : 0

  if (remainingAnimationEvents === 0 && remainingTransitionEvents === 0) {
    return null
  }

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

  const finish = (): void => {
    if (remainingAnimationEvents === 0 && remainingTransitionEvents === 0) {
      settle()
    }
  }

  const onAnimationEnd = (event: AnimationEvent): void => {
    if (cancelled || event.target !== event.currentTarget) {
      return
    }

    if (!consumeMotionEvent(remainingAnimationNames, event.animationName)) {
      return
    }

    remainingAnimationEvents = Math.max(0, remainingAnimationEvents - 1)
    finish()
  }

  const onTransitionEnd = (event: TransitionEvent): void => {
    if (cancelled || event.target !== event.currentTarget) {
      return
    }

    if (!consumeMotionEvent(remainingTransitionNames, event.propertyName)) {
      return
    }

    remainingTransitionEvents = Math.max(0, remainingTransitionEvents - 1)
    finish()
  }

  if (remainingAnimationEvents > 0) {
    cleanups.push(attachEventListener(element, 'animationend', onAnimationEnd))
    cleanups.push(attachEventListener(element, 'animationcancel', onAnimationEnd))
  }

  if (remainingTransitionEvents > 0) {
    cleanups.push(attachEventListener(element, 'transitionend', onTransitionEnd))
    cleanups.push(attachEventListener(element, 'transitioncancel', onTransitionEnd))
  }

  const timeoutDuration = Math.max(
    remainingAnimationEvents > 0 ? (motionDurations.animation.duration ?? 0) : 0,
    remainingTransitionEvents > 0 ? (motionDurations.transition.duration ?? 0) : 0,
  )
  const hasUnknownMotionDuration =
    (remainingAnimationEvents > 0 && motionDurations.animation.duration === undefined) ||
    (remainingTransitionEvents > 0 && motionDurations.transition.duration === undefined)
  const timeout = hasUnknownMotionDuration
    ? undefined
    : setTimeout(() => {
        remainingAnimationEvents = 0
        remainingTransitionEvents = 0
        finish()
      }, timeoutDuration)

  if (timeout !== undefined) {
    cleanups.push(() => clearTimeout(timeout))
  }

  return { cancel }
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
  const [registrations, setRegistrations] = createSignal<Map<number, HTMLElement>>(new Map())
  let nextRegistrationId = 0
  let legacyRegistrationId: number | undefined

  const updateRegistration = (update: (current: Map<number, HTMLElement>) => void): void => {
    setRegistrations((current) => {
      const next = new Map(current)
      update(next)
      return next
    })
  }

  const clearRegistrations = (): void => {
    legacyRegistrationId = undefined
    setRegistrations(new Map())
  }

  createEffect(() => {
    if (options.open()) {
      setPresent(true)
      return
    }

    if (!present()) {
      return
    }

    const currentElements = Array.from(registrations().values()).filter(
      (element) => element.isConnected,
    )

    if (currentElements.length === 0) {
      setPresent(false)
      return
    }

    const mode = options.mode ?? 'both'

    if (mode === 'none') {
      setPresent(false)
      return
    }

    let cancelled = false
    let remainingWaits = 0
    const waits: MotionWait[] = []
    const onElementSettled = (): void => {
      remainingWaits = Math.max(0, remainingWaits - 1)
      if (remainingWaits === 0 && !cancelled && !options.open()) {
        setPresent(false)
      }
    }

    for (const element of currentElements) {
      const wait = waitForElementMotion(element, mode, onElementSettled)
      if (wait) {
        waits.push(wait)
        remainingWaits += 1
      }
    }

    if (waits.length === 0) {
      setPresent(false)
      return
    }

    onCleanup(() => {
      cancelled = true
      for (const wait of waits) {
        wait.cancel()
      }
    })
  })

  createEffect(() => {
    if (present()) {
      return
    }

    clearRegistrations()
  })

  return {
    dataAttrs,
    present,
    registerElement(element) {
      const registrationId = nextRegistrationId++
      let active = true
      updateRegistration((current) => {
        current.set(registrationId, element)
      })

      return () => {
        if (!active) {
          return
        }

        active = false
        updateRegistration((current) => {
          current.delete(registrationId)
        })
      }
    },
    setElement(nextElement) {
      updateRegistration((current) => {
        if (legacyRegistrationId !== undefined) {
          current.delete(legacyRegistrationId)
        }

        legacyRegistrationId = undefined
        if (nextElement) {
          legacyRegistrationId = nextRegistrationId++
          current.set(legacyRegistrationId, nextElement)
        }
      })
    },
  }
}
