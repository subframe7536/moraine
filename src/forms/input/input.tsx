import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onCleanup, onMount, splitProps } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import type { ModelModifiers, ModifierValue } from '../../shared/input-modifiers.ts'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { callHandler, cn, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'
import { isInteractiveTarget } from '../shared/is-interactive-target.ts'
import { useFormReset } from '../shared/use-form-reset.ts'
import { useTextControlValue } from '../shared/use-text-control-value.ts'

import type { InputVariantProps } from './input.class.ts'
import { inputRecipe } from './input.class.ts'

export namespace InputT {
  export type Value = string | number | undefined

  export interface Slot<T = unknown> {
    /**
     * Input wrapper that positions icons, loading state, and the native input.
     */
    root?: T

    /** Native text input element. */
    input?: T

    /** Icon or loading indicator rendered before the input value. */
    leading?: T

    /** Icon or loading indicator rendered after the input value. */
    trailing?: T
  }

  export type Variant = InputVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Input component.
   */
  export interface Base<M extends ModelModifiers | undefined = ModelModifiers | undefined>
    extends
      FormIdentityOptions,
      FormValueOptions<Value>,
      FormRequiredOption,
      FormReadOnlyOption,
      FormDisableOption {
    /**
     * The type of the input element.
     * @default 'text'
     */
    type?: JSX.InputHTMLAttributes<HTMLInputElement>['type']

    /**
     * The placeholder text for the input.
     */
    placeholder?: string

    /**
     * The autocomplete attribute for the input.
     * @default 'off'
     */
    autocomplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']

    /**
     * Whether the input should automatically receive focus on mount.
     * @default false
     */
    autofocus?: boolean

    /**
     * The delay in milliseconds before automatically focusing the input.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * The maximum number of characters allowed in the input.
     */
    maxLength?: number | string

    /**
     * Leading icon name or custom content.
     */
    leading?: IconT.Name

    /**
     * Trailing icon name or custom content.
     */
    trailing?: IconT.Name

    /**
     * Whether the input is in a loading state.
     * @default false
     */
    loading?: boolean

    /**
     * The icon to show when the input is in a loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Modifiers for the input value (e.g., trim, lazy, number).
     */
    modelModifiers?: M

    /**
     * Callback when the input value changes during input.
     */
    onValueChange?: (value: ModifierValue<M>) => void

    /**
     * Callback when the input value change is committed.
     */
    onChange?: (value: ModifierValue<M>) => void

    /**
     * Event handler for the input event.
     */
    onInput?: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent>

    /**
     * Event handler for the blur event.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Event handler for the focus event.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Additional content to render inside the input container.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Input component.
   */
  export type Props<M extends ModelModifiers | undefined = ModelModifiers | undefined> = BaseProps<
    'div',
    Base<M>,
    Variant,
    Classes,
    Styles
  >
}

/**
 * Props for the Input component.
 */
export interface InputProps<
  M extends ModelModifiers | undefined = ModelModifiers | undefined,
> extends InputT.Props<M> {}

/** Text input component with leading/trailing icon slots, loading state, and form field integration. */
export function Input<M extends ModelModifiers | undefined = ModelModifiers | undefined>(
  props: InputProps<M>,
): JSX.Element {
  type RootProps = InputProps<M> & {
    onPointerDown?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>
  }
  const [local, rest] = splitProps(props as RootProps, [
    'id',
    'name',
    'value',
    'defaultValue',
    'required',
    'readOnly',
    'disabled',
    'size',
    'type',
    'placeholder',
    'autocomplete',
    'autofocus',
    'autofocusDelay',
    'maxLength',
    'leading',
    'trailing',
    'loading',
    'loadingIcon',
    'modelModifiers',
    'onValueChange',
    'onChange',
    'onInput',
    'onBlur',
    'onFocus',
    'children',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'onPointerDown',
  ])

  const config = useMoraineConfig()
  const provider = () => config().input

  const merged = mergeProps(
    {
      type: 'text',
      autocomplete: 'off',
      autofocusDelay: 0,
      variant: 'outline' as const,
      loadingIcon: 'icon-loading' as const,
    },
    () => provider()?.defaultProps,
    local,
  )
  const leading = createMemo(() => merged.leading)
  const trailing = createMemo(() => merged.trailing)
  const loadingIcon = createMemo(() => merged.loadingIcon)
  const modelModifiers = createMemo(() => merged.modelModifiers)
  const readOnly = createMemo(() => Boolean(merged.readOnly))

  const generatedId = useId(() => merged.id, 'input')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
      required: local.required,
      readOnly: readOnly(),
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: merged.defaultValue ?? '',
    }),
  )

  const slots = createMemo(() =>
    inputRecipe({
      size: field.size(),
      variant: merged.variant,
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  let inputEl: HTMLInputElement | undefined

  const textControl = useTextControlValue<InputT.Value, M>({
    defaultValue: () => merged.defaultValue,
    getElement: () => inputEl,
    getFormValue: field.value,
    modelModifiers,
    onValueChange: () => merged.onValueChange,
    setFormValue: field.setFormValue,
    shouldRestoreValue: () => merged.type !== 'file',
    value: () => merged.value,
  })
  const isLazy = textControl.isLazy
  const loadingTarget = createMemo<'leading' | 'trailing'>(() => {
    if (leading()) {
      return 'leading'
    }

    if (trailing()) {
      return 'trailing'
    }

    return 'leading'
  })

  const resolvedLeading = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading && loadingTarget() === 'leading') {
      return loadingIcon()
    }

    return leading()
  })
  const resolvedTrailing = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading && loadingTarget() === 'trailing') {
      return loadingIcon()
    }

    return trailing()
  })

  const isLeadingLoading = createMemo(() =>
    Boolean(merged.loading && loadingTarget() === 'leading'),
  )
  const isTrailingLoading = createMemo(() =>
    Boolean(merged.loading && loadingTarget() === 'trailing'),
  )
  const dataAttrs = createMemo(() => ({
    'data-invalid': field.invalid() ? '' : undefined,
    'data-disabled': field.disabled() ? '' : undefined,
    'data-required': field.required() ? '' : undefined,
    'data-readonly': readOnly() ? '' : undefined,
  }))

  const restoreControlledValue = textControl.restoreControlledValue

  const onInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onInput)
    if (defaultPrevented) {
      if (!isLazy()) {
        restoreControlledValue()
      }
      return
    }

    if (!isLazy()) {
      textControl.updateValue(event.currentTarget.value)
      field.emit('input')
      restoreControlledValue()
    }
  }

  const onChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      textControl.updateValue(value)
      field.emit('input')
    }

    if (modelModifiers()?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emit('change')
    merged.onChange?.(textControl.applyValue(value))
    restoreControlledValue()
  }

  const onBlur: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onBlur)
    if (defaultPrevented) {
      return
    }
    field.emit('blur', event)
  }

  const onFocus: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onFocus)
    if (defaultPrevented) {
      return
    }
    field.emit('focus', event)
  }

  const onRootPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, local.onPointerDown)
    if (defaultPrevented) {
      return
    }
    if (
      event.button !== 0 ||
      event.defaultPrevented ||
      event.target === inputEl ||
      isInteractiveTarget(event.target)
    ) {
      return
    }

    inputEl?.focus()
  }

  let autofocusTimer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    if (autofocusTimer !== undefined) {
      clearTimeout(autofocusTimer)
    }
  })

  useFormReset(() => inputEl?.form, restoreControlledValue)

  onMount(() => {
    if (inputEl && textControl.initialDefaultValue !== undefined && merged.type !== 'file') {
      inputEl.defaultValue = String(textControl.initialDefaultValue)
      restoreControlledValue()
    }

    if (!merged.autofocus) {
      return
    }

    autofocusTimer = setTimeout(() => {
      if (!field.disabled()) {
        inputEl?.focus()
      }
    }, merged.autofocusDelay ?? 0)
  })

  function RenderAdornment(props: { value: IconT.Name; loading: boolean }) {
    return (
      <Show
        when={typeof props.value !== 'string'}
        fallback={<Icon name={props.value} class={props.loading && 'animate-spin'} />}
      >
        {renderComponentOrElement(props.value, {})}
      </Show>
    )
  }

  return (
    <div
      data-slot="root"
      style={resolved.rootStyle()}
      class={resolved.rootClass()}
      onPointerDown={onRootPointerDown}
      {...dataAttrs()}
      {...rest}
    >
      <Show when={resolvedLeading()}>
        {(adornment) => (
          <span
            data-slot="leading"
            style={resolved.slotStyle('leading')}
            class={resolved.slotClass('leading')}
          >
            <RenderAdornment value={adornment()} loading={isLeadingLoading()} />
          </span>
        )}
      </Show>

      <input
        id={field.id()}
        ref={(element) => (inputEl = element)}
        type={merged.type}
        name={field.name()}
        placeholder={merged.placeholder}
        required={field.required()}
        disabled={field.disabled()}
        readOnly={readOnly()}
        autocomplete={merged.autocomplete}
        maxLength={merged.maxLength}
        data-slot="input"
        style={resolved.slotStyle('input')}
        class={cn(
          resolved.slotClass('input'),
          merged.type === 'file' &&
            'text-muted-foreground file:font-medium file:me-1.5 file:outline-none',
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...dataAttrs()}
        {...field.ariaAttrs()}
        {...textControl.valueProps()}
      />

      {merged.children}

      <Show when={resolvedTrailing()}>
        {(adornment) => (
          <span
            data-slot="trailing"
            style={resolved.slotStyle('trailing')}
            class={resolved.slotClass('trailing')}
          >
            <RenderAdornment value={adornment()} loading={isTrailingLoading()} />
          </span>
        )}
      </Show>
    </div>
  )
}
