import type { JSX, Ref } from 'solid-js'
import { Show, createMemo, mergeProps, onCleanup, onMount, splitProps } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import type { ModelModifiers } from '../../shared/input-modifiers.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import { isInteractiveTarget } from '../shared/is-interactive-target.ts'
import { useFormReset } from '../shared/use-form-reset.ts'
import { useTextControlValue } from '../shared/use-text-control-value.ts'

import type { InputProps, InputT } from './input.types.ts'

export * from './input.types.ts'

/** Text input component with leading/trailing icon slots, loading state, and form field integration. */
export function Input<M extends ModelModifiers | undefined = ModelModifiers | undefined>(
  props: InputProps<M>,
): JSX.Element {
  type RootProps = InputProps<M> & {
    onPointerDown?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>
    ref?: Ref<HTMLDivElement>
  }
  const [local, rest] = splitProps(props as RootProps, [
    'ref',
    'inputRef',
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

  const design = useMoraineDesign()
  const inputDesign = () => design().input

  const merged = mergeProps(
    {
      type: 'text',
      autocomplete: 'off',
      autofocusDelay: 0,
      variant: 'outline' as const,
      loadingIcon: 'icon-loading' as const,
    },
    () => inputDesign()?.defaultVariants,
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
      size: local.size,
      disabled: merged.disabled,
      required: local.required,
      readOnly: readOnly(),
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: inputDesign()?.defaultVariants?.size ?? 'md',
      initialValue: merged.defaultValue ?? '',
    }),
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return inputDesign()?.recipe({
          size: field.size(),
          variant: merged.variant,
        })
      },
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
        fallback={<Icon name={props.value} data-loading={props.loading ? '' : undefined} />}
      >
        {renderComponentOrElement(props.value, {})}
      </Show>
    )
  }

  return (
    <div
      ref={(element) => callRef(local.ref, element)}
      data-slot="root"
      onPointerDown={onRootPointerDown}
      {...dataAttrs()}
      {...rest}
      {...resolved.rootClassAndStyle()}
    >
      <Show when={resolvedLeading()}>
        {(adornment) => (
          <span data-slot="leading" {...resolved.slotClassAndStyle('leading')}>
            <RenderAdornment value={adornment()} loading={isLeadingLoading()} />
          </span>
        )}
      </Show>

      <input
        id={field.id()}
        ref={(element) => {
          inputEl = element
          callRef(local.inputRef, element)
        }}
        type={merged.type}
        name={field.name()}
        placeholder={merged.placeholder}
        required={field.required()}
        disabled={field.disabled()}
        readOnly={readOnly()}
        autocomplete={merged.autocomplete}
        maxLength={merged.maxLength}
        data-slot="input"
        {...resolved.slotClassAndStyle('input')}
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
          <span data-slot="trailing" {...resolved.slotClassAndStyle('trailing')}>
            <RenderAdornment value={adornment()} loading={isTrailingLoading()} />
          </span>
        )}
      </Show>
    </div>
  )
}
