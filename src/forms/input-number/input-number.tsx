import * as KobalteNumberField from '@kobalte/core/number-field'
import type { JSX } from 'solid-js'
import { createMemo, mergeProps, onCleanup, onMount, Show, splitProps } from 'solid-js'

import { Button } from '../../elements/button'
import type { ButtonT } from '../../elements/button'
import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { callHandler, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type { FormDisableOption, FormIdentityOptions } from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_KEYS, FORM_INPUT_INTERACTION_KEYS } from '../form-field/form-options'

import type { InputNumberOrientation, InputNumberVariantProps } from './input-number.class'
import {
  inputNumberBaseVariants,
  inputNumberControlButtonVariants,
  inputNumberControlColumnVariants,
  inputNumberRootVariants,
  resolveInputNumberAlign,
} from './input-number.class'

type ControlKind = 'increment' | 'decrement'
type PointerType = 'mouse' | 'touch' | 'pen'

interface PressRepeatState {
  activePointerId: number | null
  delayTimer: ReturnType<typeof setTimeout> | undefined
  repeatTimer: ReturnType<typeof setInterval> | undefined
  repeatStarted: boolean
  suppressNextClick: boolean
  syntheticClicksPending: number
  lastTriggeredAt: number
  lastPointerType: string | undefined
  targetEl: HTMLButtonElement | null
}

export namespace InputNumberT {
  export type Slot = 'root' | 'input' | 'increment' | 'decrement'

  export type Variant = InputNumberVariantProps

  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobalteNumberField.NumberFieldRootProps

  export interface Items {}

  /**
   * Base props for the InputNumber component.
   */
  export interface Base extends FormIdentityOptions, FormDisableOption {
    /**
     * The orientation of the control buttons.
     * @default 'horizontal'
     */
    orientation?: InputNumberOrientation

    /**
     * Placeholder text for the input.
     */
    placeholder?: string

    /**
     * Whether to show the increment button.
     * @default true
     */
    increment?: boolean

    /**
     * Icon for the increment button.
     * @default orientation === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
     */
    incrementIcon?: IconT.Name

    /**
     * Whether the increment button is disabled.
     */
    incrementDisabled?: boolean

    /**
     * Whether to show the decrement button.
     * @default true
     */
    decrement?: boolean

    /**
     * Icon for the decrement button.
     * @default orientation === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
     */
    decrementIcon?: IconT.Name

    /**
     * Whether the decrement button is disabled.
     */
    decrementDisabled?: boolean

    /**
     * Whether to automatically focus the input on mount.
     * @default false
     */
    autofocus?: boolean

    /**
     * Delay in milliseconds before focusing the input.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * Callback when the input loses focus.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Callback when the input gains focus.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Callback when the increment button is clicked.
     */
    onIncrementClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>

    /**
     * Callback when the decrement button is clicked.
     */
    onDecrementClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>

    /**
     * Whether press-and-hold should trigger repeated value changes.
     * @default true
     */
    holdRepeat?: boolean

    /**
     * Delay in milliseconds before repeated value changes start.
     * @default 500
     */
    repeatDelayMs?: number

    /**
     * Interval in milliseconds between repeated value changes.
     * @default 80
     */
    repeatIntervalMs?: number

    /**
     * Minimum elapsed time in milliseconds between repeat triggers.
     * @default 0
     */
    repeatThrottleMs?: number

    /**
     * Pointer types that can trigger press-and-hold repeat.
     * @default 'all'
     */
    repeatPointerTypes?: 'all' | PointerType
  }

  /**
   * Props for the InputNumber component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the InputNumber component.
 */
export interface InputNumberProps extends InputNumberT.Props {}

/** Numeric input with increment/decrement controls, step, and min/max constraints. */
export function InputNumber(props: InputNumberProps): JSX.Element {
  const merged = mergeProps(
    {
      variant: 'outline' as const,
      orientation: 'horizontal' as const,
      increment: true,
      decrement: true,
      autofocusDelay: 0,
      holdRepeat: true,
      repeatDelayMs: 500,
      repeatIntervalMs: 80,
      repeatThrottleMs: 0,
      repeatPointerTypes: 'all' as const,
    },
    props,
  )

  const [local, rest] = splitProps(merged, [
    ...FORM_ID_NAME_DISABLED_KEYS,
    'onRawValueChange',
    ...FORM_INPUT_INTERACTION_KEYS,
    'placeholder',
    'orientation',
    'increment',
    'incrementIcon',
    'incrementDisabled',
    'decrement',
    'decrementIcon',
    'decrementDisabled',
    'onIncrementClick',
    'onDecrementClick',
    'holdRepeat',
    'repeatDelayMs',
    'repeatIntervalMs',
    'repeatThrottleMs',
    'repeatPointerTypes',
    'autofocus',
    'autofocusDelay',
    'size',
    'variant',
    'classes',
    'styles',
  ])

  const generatedId = useId(() => local.id, 'input-number')
  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      disabled: local.disabled,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: rest.rawValue ?? rest.defaultValue ?? 0,
    }),
  )

  let inputEl: HTMLInputElement | undefined

  const resolvedIncrement = createMemo(() => Boolean(local.increment))
  const resolvedDecrement = createMemo(() => Boolean(local.decrement))
  const resolvedOrientation = createMemo<InputNumberOrientation>(
    () => local.orientation ?? 'horizontal',
  )

  const incrementIcon = createMemo<IconT.Name>(() => {
    if (local.incrementIcon) {
      return local.incrementIcon
    }

    return resolvedOrientation() === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
  })

  const decrementIcon = createMemo<IconT.Name>(() => {
    if (local.decrementIcon) {
      return local.decrementIcon
    }

    return resolvedOrientation() === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
  })

  const isVertical = createMemo(() => resolvedOrientation() === 'vertical')

  const isBorderless = createMemo(() => local.variant === 'ghost' || local.variant === 'none')

  const selectionState = {
    count: 0,
    userSelect: '',
    webkitUserSelect: '',
  }

  const pressStates: Record<ControlKind, PressRepeatState> = {
    increment: {
      activePointerId: null,
      delayTimer: undefined,
      repeatTimer: undefined,
      repeatStarted: false,
      suppressNextClick: false,
      syntheticClicksPending: 0,
      lastTriggeredAt: 0,
      lastPointerType: undefined,
      targetEl: null,
    },
    decrement: {
      activePointerId: null,
      delayTimer: undefined,
      repeatTimer: undefined,
      repeatStarted: false,
      suppressNextClick: false,
      syntheticClicksPending: 0,
      lastTriggeredAt: 0,
      lastPointerType: undefined,
      targetEl: null,
    },
  }

  function lockSelection(): void {
    if (typeof document === 'undefined') {
      return
    }

    if (selectionState.count === 0) {
      selectionState.userSelect = document.body.style.getPropertyValue('user-select')
      selectionState.webkitUserSelect = document.body.style.getPropertyValue('-webkit-user-select')
      document.body.style.setProperty('user-select', 'none')
      document.body.style.setProperty('-webkit-user-select', 'none')
    }

    selectionState.count += 1
  }

  function unlockSelection(): void {
    if (typeof document === 'undefined' || selectionState.count === 0) {
      return
    }

    selectionState.count -= 1

    if (selectionState.count === 0) {
      document.body.style.setProperty('user-select', selectionState.userSelect)
      document.body.style.setProperty('-webkit-user-select', selectionState.webkitUserSelect)
    }
  }

  function clearRepeatTimers(state: PressRepeatState): void {
    if (state.delayTimer) {
      clearTimeout(state.delayTimer)
      state.delayTimer = undefined
    }

    if (state.repeatTimer) {
      clearInterval(state.repeatTimer)
      state.repeatTimer = undefined
    }
  }

  function finishPress(state: PressRepeatState, suppressClick: boolean): void {
    state.activePointerId = null
    state.targetEl = null
    state.suppressNextClick = suppressClick
    state.repeatStarted = false
    clearRepeatTimers(state)
    unlockSelection()
  }

  function isAllowedPointerType(pointerType: string): boolean {
    return local.repeatPointerTypes === 'all' || local.repeatPointerTypes === pointerType
  }

  function getControlUserOnClick(kind: ControlKind) {
    return kind === 'increment' ? local.onIncrementClick : local.onDecrementClick
  }

  function triggerControlClick(state: PressRepeatState): void {
    const throttleMs = Math.max(0, local.repeatThrottleMs ?? 0)
    const now = Date.now()

    if (throttleMs > 0 && now - state.lastTriggeredAt < throttleMs) {
      return
    }

    state.lastTriggeredAt = now
    state.repeatStarted = true
    state.suppressNextClick = true
    state.syntheticClicksPending += 1
    state.targetEl?.click()
  }

  function onControlPointerDown(kind: ControlKind, event: PointerEvent): void {
    if (!local.holdRepeat || event.button !== 0 || !isAllowedPointerType(event.pointerType)) {
      return
    }

    const state = pressStates[kind]

    if (state.activePointerId !== null) {
      return
    }

    state.activePointerId = event.pointerId
    state.targetEl = event.currentTarget as HTMLButtonElement
    state.lastPointerType = event.pointerType
    state.repeatStarted = false
    state.lastTriggeredAt = 0

    if (event.pointerType !== 'mouse' && event.cancelable) {
      event.preventDefault()
    }

    lockSelection()

    const delayMs = Math.max(0, local.repeatDelayMs ?? 500)
    const intervalMs = Math.max(16, local.repeatIntervalMs ?? 80)

    state.delayTimer = setTimeout(() => {
      if (state.activePointerId === null) {
        return
      }

      triggerControlClick(state)

      state.repeatTimer = setInterval(() => {
        if (state.activePointerId === null) {
          return
        }

        triggerControlClick(state)
      }, intervalMs)
    }, delayMs)
  }

  function onControlPointerUp(kind: ControlKind, event: PointerEvent): void {
    const state = pressStates[kind]

    if (state.activePointerId !== event.pointerId) {
      return
    }

    // Mouse pointerup is followed by a native click, so only synthesize for touch/pen.
    const shouldSynthesizeClick = !state.repeatStarted && state.lastPointerType !== 'mouse'

    if (shouldSynthesizeClick) {
      state.syntheticClicksPending += 1
      state.targetEl?.click()
    }

    finishPress(state, state.repeatStarted || shouldSynthesizeClick)
  }

  function onControlPointerCancel(kind: ControlKind, event: PointerEvent): void {
    const state = pressStates[kind]

    if (state.activePointerId !== event.pointerId) {
      return
    }

    finishPress(state, false)
  }

  function onControlPointerLeave(kind: ControlKind): void {
    const state = pressStates[kind]

    if (state.activePointerId === null) {
      return
    }

    finishPress(state, false)
  }

  const onControlContextMenu: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (event) => {
    const eventTarget = event.currentTarget as HTMLButtonElement
    const isTouchPointer = Object.values(pressStates).some(
      (state) =>
        state.targetEl === eventTarget &&
        (state.lastPointerType === 'touch' || state.lastPointerType === 'pen'),
    )

    if (isTouchPointer && event.cancelable) {
      event.preventDefault()
    }
  }

  function onControlClick(kind: ControlKind, event: MouseEvent): void {
    const state = pressStates[kind]

    if (state.syntheticClicksPending > 0) {
      state.syntheticClicksPending -= 1
      callHandler(event, getControlUserOnClick(kind))
      return
    }

    if (state.suppressNextClick) {
      state.suppressNextClick = false
      if (event.cancelable) {
        event.preventDefault()
      }
      event.stopPropagation()
      return
    }

    callHandler(event, getControlUserOnClick(kind))
  }

  onCleanup(() => {
    clearRepeatTimers(pressStates.increment)
    clearRepeatTimers(pressStates.decrement)
    unlockSelection()
  })

  function resolveControlProps(kind: ControlKind): ButtonT.Props {
    const isIncrement = kind === 'increment'

    return {
      slotName: kind,
      styles: { root: local.styles?.[kind] },
      disabled:
        field.disabled() || (isIncrement ? local.incrementDisabled : local.decrementDisabled),
      variant: 'ghost',
      size: `icon-${field.size()}`,
      'aria-label': isIncrement ? 'Increment' : 'Decrement',
      leading: <Icon name={isIncrement ? incrementIcon() : decrementIcon()} />,
      onClick: (event) => onControlClick(kind, event),
      onPointerDown: (event) => onControlPointerDown(kind, event),
      onPointerUp: (event) => onControlPointerUp(kind, event),
      onPointerCancel: (event) => onControlPointerCancel(kind, event),
      onPointerLeave: () => onControlPointerLeave(kind),
      onContextMenu: onControlContextMenu,
      classes: {
        root: inputNumberControlButtonVariants(
          {
            control: kind,
            divided: !isIncrement && isVertical() && resolvedIncrement(),
            orientation: resolvedOrientation(),
          },
          'select-none touch-none',
          isBorderless() && 'b-transparent',
          local.variant === 'none' && 'hover:bg-transparent',
          local.classes?.[kind],
        ),
      },
    } as const
  }

  function IncrementControl(): JSX.Element {
    return <KobalteNumberField.IncrementTrigger as={Button} {...resolveControlProps('increment')} />
  }

  function DecrementControl(): JSX.Element {
    return <KobalteNumberField.DecrementTrigger as={Button} {...resolveControlProps('decrement')} />
  }

  function onRawValueChange(value: number): void {
    field.setFormValue(value)
    local.onRawValueChange?.(value)
    field.emit('change')
    field.emit('input')
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    callHandler(event, local.onBlur as any)
    field.emit('blur')
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    callHandler(event, local.onFocus as any)
    field.emit('focus')
  }

  onMount(() => {
    if (!local.autofocus) {
      return
    }

    const autofocusTimeoutId = setTimeout(() => {
      inputEl?.focus()
    }, local.autofocusDelay ?? 0)

    onCleanup(() => {
      clearTimeout(autofocusTimeoutId)
    })
  })

  return (
    <KobalteNumberField.Root
      id={`${field.id()}-root`}
      name={field.name()}
      disabled={field.disabled()}
      onRawValueChange={onRawValueChange}
      data-slot="root"
      style={merged.styles?.root}
      data-invalid={field.invalid() ? '' : undefined}
      data-disabled={field.disabled() ? '' : undefined}
      class={inputNumberRootVariants(
        {
          size: field.size(),
          variant: local.variant,
        },
        local.classes?.root,
      )}
      {...rest}
    >
      <Show when={!isVertical() && resolvedDecrement()}>
        <DecrementControl />
      </Show>

      <KobalteNumberField.Input
        id={field.id()}
        ref={(e) => (inputEl = e)}
        placeholder={local.placeholder}
        data-slot="input"
        style={merged.styles?.input}
        class={inputNumberBaseVariants(
          {
            size: field.size(),
            align: resolveInputNumberAlign(resolvedOrientation(), resolvedDecrement()),
          },
          local.classes?.input,
        )}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
      />

      <KobalteNumberField.HiddenInput />

      <Show when={isVertical() && (resolvedIncrement() || resolvedDecrement())}>
        <div
          data-slot="controls"
          class={inputNumberControlColumnVariants({
            size: field.size(),
            borderless: isBorderless(),
          })}
        >
          <Show when={resolvedIncrement()}>
            <IncrementControl />
          </Show>
          <Show when={resolvedDecrement()}>
            <DecrementControl />
          </Show>
        </div>
      </Show>

      <Show when={!isVertical() && resolvedIncrement()}>
        <IncrementControl />
      </Show>
    </KobalteNumberField.Root>
  )
}
