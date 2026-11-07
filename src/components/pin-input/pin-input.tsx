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
import { callHandler, callRef, createId } from '../../shared/utils'
import { useFieldContext, useFormField } from '../field/field-context'
import { useFormReset } from '../shared/form/use-form-reset'
import { useFormValue } from '../shared/form/use-form-value'

import { defaultPinInputMessages } from './pin-input.messages'
import { pinInputDataAttributes, pinInputRecipe } from './pin-input.recipe'
import type { PinInputProps, PinInputT } from './pin-input.types'

function isValidChar(char: string, type: PinInputT.Type): boolean {
  if (type === 'number') {
    return /^\d$/.test(char)
  }
  if (type === 'alpha') {
    return /^[a-zA-Z]$/.test(char)
  }
  if (type === 'alphanumeric') {
    return /^[a-zA-Z0-9]$/.test(char)
  }
  return char.length === 1 && !/[\r\n]/.test(char)
}

function cleanPastedText(text: string, type: PinInputT.Type): string[] {
  const stripped = text.replace(/[\s-]+/g, '')
  const result: string[] = []
  for (const char of Array.from(stripped)) {
    if (isValidChar(char, type)) {
      result.push(char)
    }
  }
  return result
}

function normalizeChars(
  val: string[] | string | undefined,
  length: number,
  type: PinInputT.Type,
): string[] {
  const result: string[] = Array.from({ length }, () => '')
  if (val === undefined || val === null) {
    return result
  }
  const chars = Array.isArray(val) ? val.flatMap((s) => Array.from(s)) : Array.from(val)
  let idx = 0
  for (const c of chars) {
    if (idx >= length) {
      break
    }
    if (isValidChar(c, type)) {
      result[idx] = c
      idx++
    }
  }
  return result
}

/**
 * An accessible pin/OTP input component.
 */
export function PinInput(props: PinInputProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'name',
    'form',
    'length',
    'type',
    'mask',
    'otp',
    'placeholder',
    'separator',
    'separatorRender',
    'value',
    'defaultValue',
    'onValueChange',
    'onComplete',
    'onChange',
    'onFocus',
    'onBlur',
    'autofocus',
    'autofocusDelay',
    'disabled',
    'required',
    'readOnly',
    'translations',
    'size',
    'variant',
    'tone',
    'highlight',
    'fixed',
    'ref',
    'inputsRef',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const length = () => Math.max(1, local.length ?? 5)
  const inputType = () => local.type ?? 'text'
  const generatedId = createId(() => local.id, 'pin-input')
  const fieldProps = {
    get id() {
      return local.id
    },
    get name() {
      return local.name
    },
    get disabled() {
      return local.disabled
    },
    get required() {
      return local.required
    },
    get readOnly() {
      return local.readOnly
    },
  }
  const field = useFormField(fieldProps, {
    get defaultId() {
      return generatedId()
    },
    get initialValue() {
      return normalizeChars(local.defaultValue ?? local.value, length(), inputType())
    },
  })
  const themeField = useFieldContext()
  const messages = useMessages('pinInput', defaultPinInputMessages, () => local.translations)
  const providerLocale = useLocale()

  const fieldDataState = {
    get disabled() {
      return field.disabled()
    },
    get invalid() {
      return !field.disabled() && (field.invalid?.() ?? false)
    },
    get readonly() {
      return field.readOnly()
    },
    get required() {
      return field.required()
    },
  }

  const {
    slots: { root: rootSlot },
    slotWith,
  } = useRecipe(pinInputRecipe, local, {
    data: {
      root: pinInputDataAttributes.root(() => fieldDataState),
      input: pinInputDataAttributes.input(() => fieldDataState),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })

  const [chars, setChars, resetChars] = useFormValue<string[]>({
    value: () => {
      const controlled = local.value !== undefined ? local.value : field.value()
      return controlled !== undefined
        ? normalizeChars(controlled as string[] | string, length(), inputType())
        : undefined
    },
    defaultValue: () => normalizeChars(local.defaultValue, length(), inputType()),
    onValueChange: (val) => {
      local.onValueChange?.(val)
      const joined = val.join('')
      local.onChange?.(joined)
      if (val.length === length() && val.every((c) => c !== '')) {
        local.onComplete?.(joined)
      }
    },
    field,
    fallback: normalizeChars(local.defaultValue, length(), inputType()),
    isEqual: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
  })

  const joinedValue = createMemo(() => chars().join(''))

  const inputEls: (HTMLInputElement | null)[] = []
  let rootEl: HTMLDivElement | undefined
  let hiddenInputEl: HTMLInputElement | undefined

  createEffect(
    on(
      () => chars(),
      () => {
        const filtered = inputEls.filter(Boolean) as HTMLInputElement[]
        if (filtered.length > 0) {
          callRef(local.inputsRef, filtered)
        }
      },
    ),
  )

  function focusInput(index: number): void {
    const clamped = Math.max(0, Math.min(length() - 1, index))
    const target = inputEls[clamped]
    if (target) {
      target.focus()
      target.select()
    }
  }

  function shouldInsertSeparator(index: number): boolean {
    if (local.separator === undefined || local.separator === false) {
      return false
    }
    const position = index + 1
    if (position >= length()) {
      return false
    }
    if (local.separator === true) {
      return position === Math.ceil(length() / 2)
    }
    if (Array.isArray(local.separator)) {
      return local.separator.includes(position)
    }
    const sep = typeof local.separator === 'number' ? local.separator : Number(local.separator)
    return Number.isInteger(sep) && sep > 0 && position % sep === 0
  }

  let autofocusTimeoutId: ReturnType<typeof setTimeout> | undefined

  onMount(() => {
    if (local.autofocus) {
      autofocusTimeoutId = setTimeout(() => {
        if (!field.disabled()) {
          focusInput(0)
        }
      }, local.autofocusDelay ?? 0)
    }
  })

  onCleanup(() => {
    if (autofocusTimeoutId !== undefined) {
      clearTimeout(autofocusTimeoutId)
    }
  })

  useFormReset(
    () => hiddenInputEl?.form ?? rootEl?.closest('form'),
    () => {
      resetChars()
    },
  )

  const [focusedIndex, setFocusedIndex] = createSignal<number | null>(null)
  const indices = createMemo(() => Array.from({ length: length() }, (_, i) => i))

  return (
    <div
      role="group"
      data-slot="pin-input"
      {...rootSlot}
      {...rest}
      id={`${field.id()}-root`}
      ref={(element) => {
        rootEl = element
        callRef(local.ref, element)
      }}
      onFocusIn={(event) => {
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) {
          return
        }
        callHandler(event, local.onFocus)
        field.emit('focus')
      }}
      onFocusOut={(event) => {
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) {
          return
        }
        callHandler(event, local.onBlur)
        field.emit('blur')
      }}
    >
      <Show when={field.name()}>
        <input
          type="hidden"
          name={field.name()}
          value={joinedValue()}
          form={local.form}
          disabled={field.disabled()}
          ref={(element) => {
            hiddenInputEl = element
          }}
        />
      </Show>

      <For each={indices()}>
        {(idx) => {
          const itemSlot = slotWith('input', {
            data: pinInputDataAttributes.input(() => fieldDataState),
          })
          const separatorSlot = slotWith('separator')

          const isRtl = () => providerLocale.dir() === 'rtl'

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
                inputMode={inputType() === 'number' ? 'numeric' : 'text'}
                pattern={inputType() === 'number' ? '[0-9]*' : undefined}
                autocomplete={idx === 0 && local.otp ? 'one-time-code' : 'off'}
                autocorrect="off"
                autocapitalize="off"
                spellcheck={false}
                placeholder={focusedIndex() === idx ? '' : (local.placeholder ?? '')}
                disabled={field.disabled()}
                readOnly={field.readOnly()}
                required={field.required()}
                value={chars()[idx] ?? ''}
                aria-label={messages().input({ index: idx + 1, length: length() })}
                aria-invalid={field.ariaAttrs()['aria-invalid']}
                onFocus={(event) => {
                  setFocusedIndex(idx)
                  event.currentTarget.select()
                }}
                onBlur={() => {
                  if (focusedIndex() === idx) {
                    setFocusedIndex(null)
                  }
                }}
                onKeyDown={(event) => {
                  if (event.defaultPrevented || field.disabled()) {
                    return
                  }

                  const previousKey = isRtl() ? 'ArrowRight' : 'ArrowLeft'
                  const nextKey = isRtl() ? 'ArrowLeft' : 'ArrowRight'

                  if (event.key === previousKey) {
                    event.preventDefault()
                    focusInput(event.ctrlKey || event.metaKey ? 0 : idx - 1)
                    return
                  }

                  if (event.key === nextKey) {
                    event.preventDefault()
                    focusInput(event.ctrlKey || event.metaKey ? length() - 1 : idx + 1)
                    return
                  }

                  if (event.key === 'Home' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    focusInput(0)
                    return
                  }

                  if (event.key === 'End' || event.key === 'ArrowDown') {
                    event.preventDefault()
                    focusInput(length() - 1)
                    return
                  }

                  if (field.readOnly()) {
                    return
                  }

                  if (event.key === 'Backspace') {
                    event.preventDefault()
                    if (event.ctrlKey || event.metaKey) {
                      setChars(Array.from({ length: length() }, () => ''))
                      focusInput(0)
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
                      setChars(next)
                      focusInput(prevIdx)
                    }
                    return
                  }

                  if (event.key === 'Delete') {
                    event.preventDefault()
                    const next = [...chars()]
                    next[idx] = ''
                    setChars(next)
                  }
                }}
                onInput={(event) => {
                  if (field.disabled() || field.readOnly()) {
                    event.currentTarget.value = chars()[idx] ?? ''
                    return
                  }

                  const raw = event.currentTarget.value
                  const currentSlotChar = chars()[idx] ?? ''

                  // Find newly typed character
                  let typed = raw
                  if (raw.length > 1) {
                    if (raw.startsWith(currentSlotChar)) {
                      typed = raw.slice(currentSlotChar.length)
                    } else if (raw.endsWith(currentSlotChar)) {
                      typed = raw.slice(0, raw.length - currentSlotChar.length)
                    }
                  }

                  const validChars = Array.from(typed).filter((c) => isValidChar(c, inputType()))

                  if (validChars.length === 0) {
                    if (raw === '') {
                      const next = [...chars()]
                      next[idx] = ''
                      setChars(next)
                    } else {
                      event.currentTarget.value = currentSlotChar
                    }
                    return
                  }

                  const charToUse = validChars[validChars.length - 1]
                  if (charToUse === undefined) {
                    return
                  }
                  const next = [...chars()]
                  next[idx] = charToUse
                  setChars(next)
                  event.currentTarget.value = charToUse

                  if (idx < length() - 1) {
                    focusInput(idx + 1)
                  }
                }}
                onPaste={(event) => {
                  if (event.defaultPrevented || field.disabled() || field.readOnly()) {
                    return
                  }

                  event.preventDefault()
                  const pastedText = event.clipboardData?.getData('text/plain') ?? ''
                  const validChars = cleanPastedText(pastedText, inputType())

                  if (validChars.length === 0) {
                    return
                  }

                  const next = [...chars()]
                  let insertIdx = idx
                  for (const c of validChars) {
                    if (insertIdx < length()) {
                      next[insertIdx] = c
                      insertIdx++
                    }
                  }
                  setChars(next)
                  focusInput(Math.min(length() - 1, insertIdx))
                }}
              />

              <Show when={shouldInsertSeparator(idx)}>
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
