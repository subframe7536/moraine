import type { Accessor } from 'solid-js'
import { createComputed, createEffect, createMemo, createSignal, on, untrack } from 'solid-js'

import { areCharArraysEqual, normalizeChars } from './pin-input-value'
import type { PinInputT } from './pin-input.types'

export interface CreatePinInputOptions {
  length: Accessor<number>
  validationType: Accessor<PinInputT.ValidationType>
  normalizeValue?: Accessor<((value: string) => string) | undefined>
  value?: Accessor<string | undefined>
  defaultValue?: string
  fieldValue: Accessor<unknown>
  setFormFieldValue: (value: unknown) => void
  disabled: Accessor<boolean>
  readOnly: Accessor<boolean>
  onValueChange?: Accessor<((value: string) => void) | undefined>
  completeValue: (joined: string) => void
  resetNativeInvalid?: () => void
  emitChange?: () => void
  emitInput?: () => void
  inputEls: (HTMLInputElement | null)[]
}

export function createPinInput(options: CreatePinInputOptions) {
  const normalize = () => options.normalizeValue?.()

  const initialChars = untrack(() => {
    const controlled = options.value?.()
    if (controlled !== undefined) {
      return normalizeChars(controlled, options.length(), options.validationType(), normalize())
    }
    const formVal = options.fieldValue()
    if (formVal !== undefined) {
      return normalizeChars(
        formVal as string,
        options.length(),
        options.validationType(),
        normalize(),
      )
    }
    return normalizeChars(
      options.defaultValue,
      options.length(),
      options.validationType(),
      normalize(),
    )
  })

  const [uncontrolledChars, setUncontrolledChars] = createSignal<string[]>(initialChars)

  // The last slot array `setChars` produced. The joined string keeps no hole positions, so a
  // controlled parent echoing it must not re-pack the slots; only a different string derives them.
  let emittedChars: string[] | undefined

  const chars = createMemo<string[]>(
    (prev) => {
      const controlled = options.value?.()
      const emitted = emittedChars
      emittedChars = undefined
      if (controlled !== undefined) {
        if (emitted !== undefined && emitted.join('') === controlled) {
          return emitted
        }
        if (prev.length === options.length() && prev.join('') === controlled) {
          return prev
        }
        return normalizeChars(controlled, options.length(), options.validationType(), normalize())
      }
      return uncontrolledChars()
    },
    initialChars,
    { equals: areCharArraysEqual },
  )

  // Field writes flow back into uncontrolled slots; hole positions survive round trip
  createEffect(
    on(options.fieldValue, (formVal) => {
      if (formVal === undefined) {
        return
      }
      const next = normalizeChars(
        formVal as string,
        options.length(),
        options.validationType(),
        normalize(),
      )
      if (next.join('') !== untrack(uncontrolledChars).join('')) {
        setUncontrolledChars(() => next)
      }
    }),
  )

  // Controlled prop updates mirror into Field
  createEffect(
    on(
      () => options.value?.(),
      (val) => {
        if (val !== undefined && options.fieldValue() !== val) {
          options.setFormFieldValue(val)
        }
      },
    ),
  )

  const joinedValue = createMemo(() => chars().join(''))
  const filled = () => joinedValue().length > 0
  const complete = () => !chars().includes('')
  const [focusedIndex, setFocusedIndex] = createSignal<number | null>(null)
  const focused = () => {
    const index = focusedIndex()
    return index !== null && index < options.length() && !options.disabled()
  }

  function focusInput(index: number): void {
    const clamped = Math.max(0, Math.min(options.length() - 1, index))
    const target = options.inputEls[clamped]
    if (target) {
      target.focus()
      target.select()
    }
  }

  function getTargetIndex(): number {
    const currentChars = chars()
    const firstEmpty = currentChars.indexOf('')
    return firstEmpty !== -1 ? firstEmpty : options.length() - 1
  }

  function getValidTargetIndex(idx: number): number {
    return chars()[idx] !== '' ? idx : getTargetIndex()
  }

  let pendingAction: { index?: number; complete?: string; joined: string } | undefined

  function queueAction(joined: string, focusIndex?: number, completeStr?: string): void {
    if (joinedValue() === joined) {
      if (focusIndex !== undefined) {
        focusInput(focusIndex)
      }
      if (completeStr !== undefined) {
        options.completeValue(completeStr)
      }
    } else {
      pendingAction = { index: focusIndex, complete: completeStr, joined }
    }
  }

  createComputed(
    on(
      joinedValue,
      (joined) => {
        const action = pendingAction
        pendingAction = undefined
        if (action && joined === action.joined) {
          if (action.index !== undefined) {
            focusInput(action.index)
          }
          if (action.complete !== undefined) {
            options.completeValue(action.complete)
          }
        }
      },
      { defer: true },
    ),
  )

  function setChars(
    update: string[] | ((prev: string[]) => string[]),
    completeOnUnchanged = false,
  ): void {
    options.resetNativeInvalid?.()
    const current = chars()
    const next = typeof update === 'function' ? update(current) : update
    const nextJoined = next.join('')
    const nextComplete = !next.includes('')

    if (areCharArraysEqual(current, next)) {
      if (nextComplete && completeOnUnchanged) {
        options.completeValue(nextJoined)
      }
      return
    }

    emittedChars = next
    if (options.value?.() === undefined) {
      setUncontrolledChars(() => next)
      options.setFormFieldValue(nextJoined)
    } else {
      options.setFormFieldValue(options.value()!)
    }

    options.onValueChange?.()?.(nextJoined)

    if (nextComplete) {
      if (chars().join('') === nextJoined) {
        options.completeValue(nextJoined)
      } else {
        queueAction(nextJoined, undefined, nextJoined)
      }
    }

    options.emitChange?.()
    options.emitInput?.()
  }

  function resetChars(): void {
    options.resetNativeInvalid?.()
    if (options.value?.() === undefined) {
      const resetValue = normalizeChars(
        options.defaultValue,
        options.length(),
        options.validationType(),
        normalize(),
      )
      setUncontrolledChars(() => resetValue)
      options.setFormFieldValue(resetValue.join(''))
    } else {
      options.setFormFieldValue(options.value()!)
    }
    const current = chars()
    const len = options.length()
    for (let i = 0; i < len; i++) {
      const el = options.inputEls[i]
      if (el) {
        el.value = current[i] ?? ''
      }
    }
  }

  return {
    chars,
    joinedValue,
    filled,
    complete,
    focusedIndex,
    setFocusedIndex,
    focused,
    focusInput,
    getTargetIndex,
    getValidTargetIndex,
    queueAction,
    setChars,
    resetChars,
  }
}
