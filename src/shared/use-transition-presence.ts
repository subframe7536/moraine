import type { Accessor } from 'solid-js'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'

import { attachEventListener } from './use-event-listener.ts'

export interface UseTransitionPresenceOptions {
  open: Accessor<boolean>
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

interface AnimationEntry {
  duration: number | undefined
  name: string
}

interface TrackedElement {
  count: number
  cleanup: () => void
}

function parseTime(value: string | undefined): number | undefined {
  const trimmed = value?.trim()

  if (!trimmed || trimmed === 'auto') {
    return undefined
  }

  if (trimmed.endsWith('ms')) {
    return Number.parseFloat(trimmed) || 0
  }

  if (trimmed.endsWith('s')) {
    return (Number.parseFloat(trimmed) || 0) * 1000
  }

  return 0
}

function getAnimationEntries(element: HTMLElement): Array<AnimationEntry> {
  const style = getComputedStyle(element)

  if (style.display === 'none') {
    return []
  }

  // JSDOM cannot resolve stylesheet animations and reports `auto` here.
  // Keep the element mounted until an animation event in that environment.
  if (style.animationDuration === 'auto') {
    return [{ name: '*', duration: undefined }]
  }

  const names = style.animationName
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name && name !== 'none')
  const durations = style.animationDuration.split(',').map(parseTime)
  const delays = style.animationDelay.split(',').map(parseTime)

  return names.map((name, index) => {
    const duration = durations[index % durations.length]
    const delay = delays[index % delays.length]

    return {
      name,
      duration:
        duration === undefined || delay === undefined ? undefined : Math.max(0, duration + delay),
    }
  })
}

function getChangedAnimationEntries(
  entries: Array<AnimationEntry>,
  previousNames: Array<string>,
): Array<AnimationEntry> {
  const remainingPreviousNames = new Map<string, number>()

  for (const name of previousNames) {
    remainingPreviousNames.set(name, (remainingPreviousNames.get(name) ?? 0) + 1)
  }

  return entries.filter((entry) => {
    const count = remainingPreviousNames.get(entry.name) ?? 0
    if (count === 0) {
      return true
    }

    remainingPreviousNames.set(entry.name, count - 1)
    return false
  })
}

/**
 * Keeps registered elements mounted until their CSS exit animations settle.
 */
export function useTransitionPresence(
  options: UseTransitionPresenceOptions,
): TransitionPresenceState {
  const [present, setPresent] = createSignal(options.open())
  const dataAttrs: TransitionPresenceState['dataAttrs'] = () =>
    options.open() ? { 'data-expanded': '' } : { 'data-closed': '' }
  const [registrations, setRegistrations] = createSignal<Map<number, HTMLElement>>(new Map())
  const animationNames = new Map<HTMLElement, Array<string>>()
  const trackedElements = new Map<HTMLElement, TrackedElement>()
  const measuredElements = new Set<HTMLElement>()
  const pendingAnimations = new Map<HTMLElement, Array<string>>()
  let exitTimeout: ReturnType<typeof setTimeout> | undefined
  let nextRegistrationId = 0
  let legacyRegistrationId: number | undefined

  const clearPendingAnimations = (): void => {
    if (exitTimeout !== undefined) {
      clearTimeout(exitTimeout)
      exitTimeout = undefined
    }
    pendingAnimations.clear()
    measuredElements.clear()
  }

  const finishHiding = (): void => {
    if (
      options.open() ||
      pendingAnimations.size > 0 ||
      Array.from(trackedElements.keys()).some((element) => !measuredElements.has(element))
    ) {
      return
    }

    clearPendingAnimations()
    setPresent(false)
  }

  const settleAnimation = (element: HTMLElement, animationName: string): void => {
    const pendingNames = pendingAnimations.get(element)
    if (!pendingNames) {
      return
    }

    const index = animationName
      ? pendingNames.findIndex((name) => name === animationName || name === '*')
      : pendingNames.length === 1
        ? 0
        : -1
    if (index < 0) {
      return
    }

    pendingNames.splice(index, 1)
    if (pendingNames.length === 0) {
      pendingAnimations.delete(element)
    }

    finishHiding()
  }

  const retainElement = (element: HTMLElement): void => {
    const tracked = trackedElements.get(element)
    if (tracked) {
      tracked.count += 1
      return
    }

    const entries = getAnimationEntries(element)
    measuredElements.delete(element)
    animationNames.set(
      element,
      options.open() && !entries.some((entry) => entry.name === '*')
        ? entries.map((entry) => entry.name)
        : [],
    )
    const onAnimationStart = (event: AnimationEvent): void => {
      if (event.target !== event.currentTarget || !options.open()) {
        return
      }

      const entries = getAnimationEntries(element)
      animationNames.set(
        element,
        entries.some((entry) => entry.name === '*') ? [] : entries.map((entry) => entry.name),
      )
    }
    const onAnimationSettled = (event: AnimationEvent): void => {
      if (event.target === event.currentTarget) {
        settleAnimation(element, event.animationName)
      }
    }
    const removeStartListener = attachEventListener(element, 'animationstart', onAnimationStart)
    const removeEndListener = attachEventListener(element, 'animationend', onAnimationSettled)
    const removeCancelListener = attachEventListener(element, 'animationcancel', onAnimationSettled)

    trackedElements.set(element, {
      count: 1,
      cleanup: () => {
        removeStartListener()
        removeEndListener()
        removeCancelListener()
      },
    })
  }

  const releaseElement = (element: HTMLElement): void => {
    const tracked = trackedElements.get(element)
    if (!tracked) {
      return
    }

    tracked.count -= 1
    if (tracked.count > 0) {
      return
    }

    tracked.cleanup()
    trackedElements.delete(element)
    measuredElements.delete(element)
    animationNames.delete(element)
    pendingAnimations.delete(element)
    finishHiding()
  }

  const updateRegistration = (update: (current: Map<number, HTMLElement>) => void): void => {
    setRegistrations((current) => {
      const next = new Map(current)
      update(next)
      return next
    })
  }

  const addRegistration = (element: HTMLElement): number => {
    const registrationId = nextRegistrationId++
    retainElement(element)
    updateRegistration((current) => {
      current.set(registrationId, element)
    })
    return registrationId
  }

  const removeRegistration = (registrationId: number): void => {
    let element: HTMLElement | undefined
    updateRegistration((current) => {
      element = current.get(registrationId)
      current.delete(registrationId)
    })

    if (element) {
      releaseElement(element)
    }
  }

  const clearRegistrations = (): void => {
    const current = registrations()
    if (current.size === 0) {
      return
    }

    legacyRegistrationId = undefined
    for (const element of current.values()) {
      releaseElement(element)
    }
    setRegistrations(new Map())
  }

  createEffect(
    on([options.open, registrations], ([open, currentRegistrations]) => {
      const currentElements = Array.from(currentRegistrations.values())

      if (open) {
        clearPendingAnimations()
        setPresent(true)
        return
      }

      if (!present()) {
        return
      }

      if (currentElements.length === 0) {
        clearPendingAnimations()
        setPresent(false)
        return
      }

      let cancelled = false

      queueMicrotask(() => {
        if (cancelled) {
          return
        }

        pendingAnimations.clear()
        measuredElements.clear()
        let timeoutDuration = 0
        let hasUnknownDuration = false

        for (const element of currentElements) {
          measuredElements.add(element)
          if (!element.isConnected) {
            continue
          }

          const entries = getChangedAnimationEntries(
            getAnimationEntries(element),
            animationNames.get(element) ?? [],
          ).filter((entry) => entry.duration === undefined || entry.duration > 0)
          if (entries.length === 0) {
            continue
          }

          pendingAnimations.set(
            element,
            entries.map((entry) => entry.name),
          )
          for (const entry of entries) {
            if (entry.duration === undefined) {
              hasUnknownDuration = true
            } else {
              timeoutDuration = Math.max(timeoutDuration, entry.duration)
            }
          }
        }

        if (pendingAnimations.size === 0) {
          finishHiding()
          return
        }

        if (!hasUnknownDuration) {
          exitTimeout = setTimeout(() => {
            exitTimeout = undefined
            pendingAnimations.clear()
            finishHiding()
          }, timeoutDuration)
        }
      })

      onCleanup(() => {
        cancelled = true
        if (exitTimeout !== undefined) {
          clearTimeout(exitTimeout)
          exitTimeout = undefined
        }
      })
    }),
  )

  createEffect(
    on(present, (isPresent) => {
      if (!isPresent) {
        clearRegistrations()
      }
    }),
  )

  return {
    dataAttrs,
    present,
    registerElement(element) {
      const registrationId = addRegistration(element)
      let active = true

      return () => {
        if (!active) {
          return
        }

        active = false
        removeRegistration(registrationId)
      }
    },
    setElement(nextElement) {
      const previousRegistrationId = legacyRegistrationId

      if (nextElement) {
        legacyRegistrationId = addRegistration(nextElement)
      } else {
        legacyRegistrationId = undefined
      }

      if (previousRegistrationId !== undefined) {
        removeRegistration(previousRegistrationId)
      }
    },
  }
}
