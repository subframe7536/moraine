import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
  splitProps,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { HiddenInput } from '../../shared/hidden-input'
import { createKeyDownHandler } from '../../shared/keyboard'
import type { KeyEvent } from '../../shared/keyboard'
import { callHandler, callRef, createId, isAndroidUserAgent } from '../../shared/utils'
import { useFieldContext, useFormField } from '../field/field-context'
import { useFormReset } from '../shared/form/use-form-reset'
import { useHiddenInputValidation } from '../shared/form/use-hidden-input-validation'

import { createPinInput } from './create-pin-input'
import {
  VALIDATION_CONFIG,
  createEmptyChars,
  filterInputText,
  filterTypedChars,
  spliceChars,
} from './pin-input-value'
import { defaultPinInputMessages } from './pin-input.messages'
import { pinInputDataAttributes, pinInputRecipe } from './pin-input.recipe'
import type { PinInputProps } from './pin-input.types'

/**
 * An accessible pin/OTP input component.
 */
export function PinInput(props: PinInputProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'name',
    'form',
    'length',
    'validationType',
    'mask',
    'otp',
    'placeholder',
    'separator',
    'separatorRender',
    'value',
    'defaultValue',
    'onValueChange',
    'onComplete',
    'onValueInvalid',
    'onChange',
    'autoSubmit',
    'inputMode',
    'normalizeValue',
    'onFocus',
    'onBlur',
    'onFocusIn',
    'onFocusOut',
    'autofocus',
    'autofocusDelay',
    'disabled',
    'required',
    'readOnly',
    'translations',
    'size',
    'variant',
    'ref',
    'inputsRef',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const length = () => Math.max(1, local.length ?? 5)
  const validationType = () => local.validationType ?? 'text'
  const generatedId = createId(() => local.id, 'pin-input')
  const field = useFormField(local, {
    bind: false,
    focus: true,
    get defaultId() {
      return generatedId()
    },
    get initialValue() {
      return local.value ?? local.defaultValue ?? ''
    },
  })
  const themeField = useFieldContext()
  const messages = useMessages('pinInput', defaultPinInputMessages, () => local.translations)
  const providerLocale = useLocale()

  const inputEls: (HTMLInputElement | null)[] = []
  let rootEl: HTMLDivElement | undefined
  let hiddenInputEl: HTMLInputElement | undefined

  const getOwningForm = () =>
    hiddenInputEl?.form ?? inputEls[0]?.form ?? rootEl?.closest('form') ?? null

  function completeValue(joined: string): void {
    local.onComplete?.(joined)
    if (local.autoSubmit) {
      const formElement = getOwningForm()
      if (formElement && typeof formElement.requestSubmit === 'function') {
        formElement.requestSubmit()
      }
    }
  }

  const {
    nativeInvalid,
    resetNativeInvalid,
    onInvalid: handleHiddenInputInvalid,
  } = useHiddenInputValidation({
    focusTarget: () => inputEls[state.getTargetIndex()] ?? inputEls[0],
  })

  const state = createPinInput({
    length,
    validationType,
    normalizeValue: () => local.normalizeValue,
    value: () => local.value,
    defaultValue: local.defaultValue,
    fieldValue: field.value,
    setFormFieldValue: field.setFormValue,
    disabled: field.disabled,
    readOnly: field.readOnly,
    onValueChange: () => local.onValueChange,
    onChange: () => local.onChange,
    completeValue,
    resetNativeInvalid,
    emitChange: () => field.emit('change'),
    emitInput: () => field.emit('input'),
    inputEls,
  })

  const {
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
  } = state

  const fieldDataState = {
    disabled: field.disabled,
    invalid: () => !field.disabled() && (field.invalid() || nativeInvalid()),
    readonly: field.readOnly,
    required: field.required,
  }

  const {
    slots: { root: rootSlot, separator: separatorSlot },
    slotWith,
  } = useRecipe(pinInputRecipe, local, {
    data: {
      root: pinInputDataAttributes.root({
        ...fieldDataState,
        complete,
        filled,
        focused,
      }),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })

  function updateInputsRef(): void {
    if (!local.inputsRef) {
      return
    }
    const len = length()
    const filtered: HTMLInputElement[] = []
    for (let i = 0; i < len; i++) {
      const el = inputEls[i]
      if (el) {
        filtered.push(el)
      }
    }
    if (filtered.length > 0) {
      callRef(local.inputsRef, filtered)
    }
  }

  onMount(() => {
    updateInputsRef()
  })

  createEffect(
    on(
      length,
      (len) => {
        inputEls.length = len
        updateInputsRef()
      },
      { defer: true },
    ),
  )

  onCleanup(() => {
    if (local.inputsRef) {
      callRef(local.inputsRef, [])
    }
    inputEls.length = 0
  })

  createEffect(
    on(
      chars,
      (currentChars) => {
        const focused = focusedIndex()
        if (focused !== null) {
          const firstEmpty = currentChars.indexOf('')
          const isSelectable =
            focused < currentChars.length &&
            (currentChars[focused] !== '' || focused === firstEmpty)
          if (!isSelectable) {
            focusInput(getTargetIndex())
          }
        }
      },
      { defer: true },
    ),
  )

  /**
   * Commits raw input text (`onInput` and IME `compositionend`) into the slot at `idx`,
   * distributing consecutive valid characters across following slots.
   */
  function handleSlotInput(element: HTMLInputElement, idx: number): void {
    if (field.disabled() || field.readOnly()) {
      element.value = chars()[idx] ?? ''
      return
    }

    const raw = element.value
    const currentSlotChar = chars()[idx] ?? ''

    // Find newly typed characters
    let typed = raw
    if (raw.length > 1) {
      if (raw.startsWith(currentSlotChar)) {
        typed = raw.slice(currentSlotChar.length)
      } else if (raw.endsWith(currentSlotChar)) {
        typed = raw.slice(0, raw.length - currentSlotChar.length)
      }
    }

    const [validChars, didReject] = filterTypedChars(typed, validationType(), local.normalizeValue)
    if (didReject) {
      local.onValueInvalid?.(raw)
    }

    if (validChars.length === 0) {
      if (raw === '') {
        const next = [...chars()]
        next[idx] = ''
        setChars(next)
        element.value = chars()[idx] ?? ''
      } else {
        // Restore the rejected character and keep the slot selected, matching focus behavior.
        element.value = currentSlotChar
        element.select()
      }
      return
    }

    // Multiple valid characters (autofill or IME text) distribute across slots,
    // replacing the characters that occupied them.
    if (validChars.length > 1) {
      const next = spliceChars(chars(), idx, validChars, length())
      const nextJoined = next.join('')
      setChars(next)
      element.value = chars()[idx] ?? ''
      queueAction(nextJoined, Math.min(idx + validChars.length, length() - 1))
      return
    }

    const next = [...chars()]
    next[idx] = validChars[0] ?? ''
    const nextJoined = next.join('')
    setChars(next)
    element.value = chars()[idx] ?? ''

    if (idx < length() - 1) {
      queueAction(nextJoined, idx + 1)
    } else {
      element.select()
    }
  }

  const separatorPositions = createMemo<ReadonlySet<number> | null>(() => {
    const sep = local.separator
    if (!sep) {
      return null
    }
    const len = length()
    if (sep === true) {
      const pos = Math.ceil(len / 2)
      return pos < len ? new Set([pos]) : null
    }
    if (Array.isArray(sep)) {
      const valid = sep.filter((pos) => pos > 0 && pos < len)
      return valid.length > 0 ? new Set(valid) : null
    }
    if (typeof sep === 'number' && Number.isInteger(sep) && sep > 0) {
      const set = new Set<number>()
      for (let pos = sep; pos < len; pos += sep) {
        set.add(pos)
      }
      return set.size > 0 ? set : null
    }
    return null
  })

  function hasSeparator(index: number): boolean {
    return separatorPositions()?.has(index + 1) ?? false
  }

  let autofocusTimeoutId: ReturnType<typeof setTimeout> | undefined

  onMount(() => {
    if (local.autofocus) {
      autofocusTimeoutId = setTimeout(() => {
        if (!field.disabled()) {
          focusInput(getTargetIndex())
        }
      }, local.autofocusDelay ?? 0)
    }
  })

  onCleanup(() => {
    if (autofocusTimeoutId !== undefined) {
      clearTimeout(autofocusTimeoutId)
    }
  })

  useFormReset(getOwningForm, resetChars)

  const indices = createMemo(() => Array.from({ length: length() }, (_, i) => i))
  const validationConfig = () => VALIDATION_CONFIG[validationType()]
  const inputMode = () => local.inputMode ?? validationConfig()?.inputMode ?? 'text'

  /** The single tabbable slot: the focused one, or the first editable target otherwise. */
  function tabbableIndex(): number {
    const index = focusedIndex()
    return index !== null ? Math.min(index, length() - 1) : getTargetIndex()
  }

  // While an IME composition is active, intermediate text is exposed through `input`
  // as an accumulating string; committing per event would fill too many slots.
  const [composing, setComposing] = createSignal(false)

  const hasBoundaryModifier = (event: KeyEvent<HTMLInputElement>) =>
    (event.ctrlKey || event.metaKey) && !event.altKey

  const moveToStart = (event: KeyEvent<HTMLInputElement>) => {
    event.stopPropagation()
    focusInput(0)
  }

  const moveToEnd = (event: KeyEvent<HTMLInputElement>) => {
    event.stopPropagation()
    focusInput(getTargetIndex())
  }

  const onSlotKeyDown = createKeyDownHandler<HTMLInputElement, [number]>({
    disabled: () => field.disabled(),
    composing: () => composing(),
    direction: () => providerLocale.dir(),
    orientation: 'horizontal',
    keys: {
      previous: (event, idx) => {
        event.stopPropagation()
        focusInput(hasBoundaryModifier(event) ? 0 : Math.max(0, idx - 1))
      },
      next: (event, idx) => {
        event.stopPropagation()
        const end = getTargetIndex()
        focusInput(hasBoundaryModifier(event) ? end : Math.min(end, idx + 1))
      },
      Home: moveToStart,
      ArrowUp: moveToStart,
      End: moveToEnd,
      ArrowDown: moveToEnd,
      Backspace: {
        when: () => !field.readOnly(),
        handle: (event, idx) => {
          event.stopPropagation()
          if (hasBoundaryModifier(event)) {
            const next = createEmptyChars(length())
            setChars(next)
            queueAction('', 0)
            return
          }

          if (chars()[idx] !== '') {
            const next = [...chars()]
            next[idx] = ''
            setChars(next)
          } else {
            const prevIdx = Math.max(0, idx - 1)
            const next = [...chars()]
            next[prevIdx] = ''
            const nextJoined = next.join('')
            setChars(next)
            queueAction(nextJoined, prevIdx)
          }
        },
      },
      Delete: {
        when: () => !field.readOnly(),
        handle: (event, idx) => {
          event.stopPropagation()
          const next = [...chars()]
          next[idx] = ''
          setChars(next)
        },
      },
    },
  })

  return (
    <div
      role="group"
      data-slot="pin-input"
      {...rootSlot}
      {...rest}
      id={`${field.id()}-root`}
      {...field.ariaAttrs()}
      ref={(element) => {
        rootEl = element
        callRef(local.ref, element)
      }}
      onFocusIn={(event) => {
        if (
          callHandler(event, local.onFocusIn).defaultPrevented ||
          (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node))
        ) {
          return
        }
        if (!callHandler(event, local.onFocus).defaultPrevented) {
          field.emit('focus', event)
        }
      }}
      onFocusOut={(event) => {
        if (
          callHandler(event, local.onFocusOut).defaultPrevented ||
          (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node))
        ) {
          return
        }
        if (!callHandler(event, local.onBlur).defaultPrevented) {
          field.emit('blur', event)
        }
      }}
      onMouseDown={(event) => {
        if (
          event.button === 0 &&
          (event.target === event.currentTarget ||
            (event.target as HTMLElement)?.closest('[data-slot="pin-input-separator"]'))
        ) {
          event.preventDefault()
          focusInput(getTargetIndex())
        }
      }}
      onClick={(event) => {
        if (
          event.target === event.currentTarget ||
          (event.target as HTMLElement)?.closest('[data-slot="pin-input-separator"]')
        ) {
          focusInput(getTargetIndex())
        }
      }}
    >
      <Show when={field.name()}>
        <HiddenInput
          type="text"
          name={field.name()}
          form={local.form}
          value={joinedValue()}
          autocomplete={local.otp ? 'one-time-code' : 'off'}
          inputMode={inputMode()}
          minLength={length()}
          maxLength={length()}
          pattern={validationConfig()?.getRootPattern(length())}
          disabled={field.disabled()}
          readOnly={field.readOnly()}
          required={field.required()}
          tabIndex={-1}
          aria-hidden="true"
          onInvalid={handleHiddenInputInvalid}
          ref={(element) => {
            hiddenInputEl = element
          }}
          onFocus={() => {
            if (!field.disabled()) {
              focusInput(getTargetIndex())
            }
          }}
          onInput={(event) => {
            if (field.disabled() || field.readOnly() || event.defaultPrevented) {
              event.currentTarget.value = joinedValue()
              return
            }

            const raw = event.currentTarget.value
            const [validChars, didReject] = filterInputText(
              raw,
              validationType(),
              local.normalizeValue,
            )
            if (didReject) {
              local.onValueInvalid?.(raw)
            }

            const next = spliceChars(createEmptyChars(length()), 0, validChars, length())
            const nextJoined = next.join('')
            setChars(next)
            event.currentTarget.value = joinedValue()
            if (nextJoined !== '') {
              queueAction(nextJoined, Math.min(validChars.length, length()) - 1)
            }
          }}
        />
      </Show>

      <For each={indices()}>
        {(idx) => {
          const itemSlot = slotWith('input', {
            data: pinInputDataAttributes.input({
              ...fieldDataState,
              complete,
              focused: () => focusedIndex() === idx && !field.disabled(),
              filled: () => chars()[idx] !== '',
            }),
          })

          return (
            <>
              <input
                data-slot="pin-input-input"
                {...itemSlot}
                id={`${field.id()}-${idx}`}
                ref={(element) => {
                  inputEls[idx] = element
                  if (idx === 0) {
                    field.setControlRef(element)
                  }
                }}
                type={local.mask ? 'password' : 'text'}
                inputMode={inputMode()}
                pattern={validationConfig()?.slotPattern}
                autocomplete={idx === 0 && local.otp ? 'one-time-code' : 'off'}
                autocorrect="off"
                autocapitalize="off"
                spellcheck={false}
                enterkeyhint={idx === length() - 1 ? 'done' : 'next'}
                maxLength={idx === 0 ? length() : undefined}
                tabIndex={idx === tabbableIndex() ? 0 : -1}
                form={local.form}
                placeholder={focusedIndex() === idx ? '' : (local.placeholder ?? '')}
                disabled={field.disabled()}
                readOnly={field.readOnly()}
                required={field.required()}
                value={chars()[idx] ?? ''}
                aria-label={messages().input({ index: idx + 1, length: length() })}
                aria-invalid={
                  field.ariaAttrs()['aria-invalid'] || (nativeInvalid() ? 'true' : undefined)
                }
                aria-describedby={field.ariaAttrs()['aria-describedby']}
                onFocus={(event) => {
                  if (event.defaultPrevented || field.disabled()) {
                    return
                  }
                  const targetIdx = getValidTargetIndex(idx)
                  if (targetIdx !== idx) {
                    focusInput(targetIdx)
                    return
                  }
                  setFocusedIndex(idx)
                  event.currentTarget.select()
                }}
                onBlur={(event) => {
                  if (event.relatedTarget && rootEl?.contains(event.relatedTarget as Node)) {
                    return
                  }
                  if (focusedIndex() === idx) {
                    setFocusedIndex(null)
                  }
                }}
                onMouseDown={(event) => {
                  if (event.button !== 0 || event.defaultPrevented || field.disabled()) {
                    return
                  }
                  event.preventDefault()
                  focusInput(getValidTargetIndex(idx))
                }}
                onClick={(event) => {
                  if (event.defaultPrevented || field.disabled()) {
                    return
                  }
                  focusInput(getValidTargetIndex(idx))
                }}
                onKeyDown={(event) => onSlotKeyDown(event, idx)}
                onInput={(event) => {
                  if (composing()) {
                    return
                  }
                  if (event.defaultPrevented) {
                    event.currentTarget.value = chars()[idx] ?? ''
                    return
                  }
                  handleSlotInput(event.currentTarget, idx)
                }}
                onCompositionStart={() => {
                  if (!isAndroidUserAgent()) {
                    setComposing(true)
                  }
                }}
                onCompositionEnd={(event) => {
                  if (!composing()) {
                    return
                  }
                  setComposing(false)
                  handleSlotInput(event.currentTarget, idx)
                }}
                onPaste={(event) => {
                  if (event.defaultPrevented || field.disabled() || field.readOnly()) {
                    return
                  }

                  let pastedText: string
                  try {
                    pastedText = event.clipboardData?.getData('text/plain') ?? ''
                  } catch {
                    return
                  }
                  event.preventDefault()

                  const [validChars, didReject] = filterInputText(
                    pastedText,
                    validationType(),
                    local.normalizeValue,
                  )
                  if (didReject || validChars.length > length()) {
                    local.onValueInvalid?.(pastedText)
                  }
                  if (validChars.length === 0) {
                    return
                  }

                  const next = spliceChars(chars(), idx, validChars, length())
                  const nextJoined = next.join('')
                  setChars(next, !next.includes(''))
                  queueAction(nextJoined, Math.min(idx + validChars.length, length() - 1))
                }}
              />

              <Show when={hasSeparator(idx)}>
                <span
                  data-slot="pin-input-separator"
                  role="presentation"
                  aria-hidden="true"
                  {...separatorSlot}
                >
                  <Show
                    when={typeof local.separatorRender === 'function' && local.separatorRender}
                    fallback="•"
                    keyed
                  >
                    {(Separator) => <Separator index={idx} />}
                  </Show>
                </span>
              </Show>
            </>
          )
        }}
      </For>
    </div>
  )
}
