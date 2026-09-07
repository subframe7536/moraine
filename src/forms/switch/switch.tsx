import type { JSX, Ref } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, splitProps, untrack } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import { HiddenInput } from '../../shared/hidden-input.tsx'
import { hasNonEmptyJsxContent } from '../../shared/jsx-content.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { SwitchProps } from './switch.types.ts'

export * from './switch.types.ts'

/** Toggle switch control with icon slots and loading state. */
export function Switch<TTrue = boolean, TFalse = boolean>(
  props: SwitchProps<TTrue, TFalse>,
): JSX.Element {
  type RootProps = SwitchProps<TTrue, TFalse> & {
    onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>
    ref?: Ref<HTMLDivElement>
  }
  const [local, rest] = splitProps(props as RootProps, [
    'ref',
    'inputRef',
    'id',
    'name',
    'disabled',
    'required',
    'readOnly',
    'value',
    'checked',
    'defaultChecked',
    'trueValue',
    'falseValue',
    'loading',
    'loadingIcon',
    'checkedIcon',
    'uncheckedIcon',
    'label',
    'description',
    'onChange',
    'onPointerDown',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'onClick',
  ])

  const design = useMoraineDesign()
  const switchDesign = () => design().switch

  const merged = mergeProps(
    {
      loading: false,
      loadingIcon: 'icon-loading' as const,
      trueValue: true,
      falseValue: false,
      value: 'on',
    },
    local,
  )
  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)
  const loadingIcon = createMemo(() => merged.loadingIcon)
  const checkedIcon = createMemo(() => merged.checkedIcon)
  const uncheckedIcon = createMemo(() => merged.uncheckedIcon)
  const showLabel = createMemo(() => hasNonEmptyJsxContent(label()))
  const showDescription = createMemo(() => hasNonEmptyJsxContent(description()))
  const readOnly = createMemo(() => Boolean(merged.readOnly))

  const generatedId = useId(() => merged.id, 'switch')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: local.size,
      disabled: merged.disabled || merged.loading,
      required: local.required,
      readOnly: readOnly(),
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: switchDesign()?.defaultVariants?.size ?? 'md',
      initialValue:
        normalizeFieldValue(
          merged.checked !== undefined ? merged.checked : merged.defaultChecked,
        ) ?? merged.falseValue,
    }),
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return switchDesign()?.recipe({ size: field.size() })
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

  const labelId = createMemo(() => `${field.id()}-label`)
  const descriptionId = createMemo(() => `${field.id()}-description`)

  let inputEl: HTMLInputElement | undefined
  const initialDefaultChecked = untrack(() => Boolean(merged.defaultChecked))

  function toCheckedState(value: unknown): boolean {
    if (value === merged.trueValue) {
      return true
    }

    if (value === merged.falseValue) {
      return false
    }

    return typeof value === 'boolean' ? value : false
  }

  function normalizeFieldValue(value: unknown): unknown {
    if (value === undefined) {
      return value
    }

    if (value === merged.trueValue || value === merged.falseValue) {
      return value
    }

    if (typeof value === 'boolean') {
      return value ? merged.trueValue : merged.falseValue
    }

    return value
  }

  const [checked, setChecked] = useControllableValue<boolean>({
    value: () => {
      if (merged.checked !== undefined) {
        return toCheckedState(merged.checked)
      }

      if (field.value() !== undefined) {
        return toCheckedState(field.value())
      }

      return undefined
    },
    defaultValue: () => Boolean(merged.defaultChecked),
  })

  createEffect(() => {
    if (merged.checked === undefined) {
      return
    }

    field.setFormValue(normalizeFieldValue(merged.checked))
  })

  function onChange(nextChecked: boolean): void {
    const nextValue = nextChecked ? (merged.trueValue as TTrue) : (merged.falseValue as TFalse)

    setChecked(nextChecked)

    field.setFormValue(nextValue)
    merged.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  const switchAriaAttrs = createMemo(() => {
    const attrs = { ...field.ariaAttrs() }
    const describedBy = [attrs['aria-describedby'], showDescription() ? descriptionId() : undefined]
      .filter(Boolean)
      .join(' ')

    if (describedBy) {
      attrs['aria-describedby'] = describedBy
    }
    if (!attrs['aria-labelledby'] && showLabel()) {
      attrs['aria-labelledby'] = labelId()
    }

    return attrs
  })

  createEffect(() => {
    if (inputEl) {
      inputEl.checked = Boolean(checked())
    }
  })

  function toggle(): void {
    if (field.disabled() || readOnly()) {
      return
    }

    onChange(!checked())
  }

  useFormReset(
    () => inputEl?.form,
    () => {
      const controlledChecked = merged.checked
      const nextChecked =
        controlledChecked === undefined ? initialDefaultChecked : toCheckedState(controlledChecked)

      if (controlledChecked === undefined) {
        setChecked(nextChecked)
      }

      if (inputEl) {
        inputEl.checked = nextChecked
      }

      field.setFormValue(nextChecked ? merged.trueValue : merged.falseValue)
    },
  )

  function onPointerDown(
    event: Parameters<JSX.EventHandler<HTMLButtonElement, PointerEvent>>[0],
  ): void {
    const { defaultPrevented } = callHandler(event, merged.onPointerDown)
    if (defaultPrevented) {
      return
    }

    if (document.activeElement === inputEl) {
      event.preventDefault()
    }
  }

  const resolvedIconName = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading) {
      return loadingIcon()
    }

    return checked() ? checkedIcon() : uncheckedIcon()
  })

  const onRootClick: JSX.EventHandler<HTMLDivElement, MouseEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, local.onClick)
    if (defaultPrevented || event.button !== 0) {
      return
    }

    const target = event.target
    if (target instanceof Element && target.closest('[data-slot="track"]')) {
      toggle()
    }
  }

  return (
    <div
      ref={(element) => callRef(local.ref, element)}
      data-slot="root"
      {...rest}
      {...resolved.rootClassAndStyle()}
      onClick={onRootClick}
    >
      <HiddenInput
        ref={(element) => {
          inputEl = element
          callRef(local.inputRef, element)
        }}
        id={`${field.id()}-input`}
        type="checkbox"
        name={field.name()}
        value={merged.value}
        checked={Boolean(checked())}
        required={field.required()}
        disabled={field.disabled()}
        readOnly={readOnly()}
        tabIndex={-1}
        aria-hidden="true"
        class="peer"
        data-slot="input"
        onChange={(event) => {
          event.stopPropagation()

          if (field.disabled() || readOnly()) {
            event.currentTarget.checked = Boolean(checked())
            return
          }

          onChange(event.currentTarget.checked)
          event.currentTarget.checked = Boolean(checked())
        }}
      />

      <button
        id={field.id()}
        type="button"
        role="switch"
        disabled={field.disabled()}
        data-slot="track"
        data-invalid={field.invalid() ? '' : undefined}
        aria-checked={Boolean(checked())}
        {...switchAriaAttrs()}
        {...resolved.slotClassAndStyle('track')}
        onPointerDown={onPointerDown}
        data-checked={checked() ? '' : undefined}
        data-unchecked={!checked() ? '' : undefined}
        data-disabled={field.disabled() ? '' : undefined}
        data-readonly={readOnly() ? '' : undefined}
      >
        <span
          data-slot="thumb"
          data-checked={checked() ? '' : undefined}
          data-disabled={field.disabled() ? '' : undefined}
          data-readonly={readOnly() ? '' : undefined}
          {...resolved.slotClassAndStyle('thumb')}
        >
          <Show when={resolvedIconName()} keyed>
            {(iconName) => (
              <Icon
                name={iconName}
                data-checked={!merged.loading && checked() ? '' : undefined}
                data-unchecked={!merged.loading && !checked() ? '' : undefined}
                data-loading={merged.loading ? '' : undefined}
                class={resolved.slotClass('icon')}
              />
            )}
          </Show>
        </span>
      </button>

      <Show when={showLabel() || showDescription()}>
        <span data-slot="wrapper" {...resolved.slotClassAndStyle('wrapper')}>
          <Show when={showLabel()}>
            <label
              for={field.id()}
              id={labelId()}
              data-slot="label"
              data-required={field.required() ? '' : undefined}
              {...resolved.slotClassAndStyle('label')}
            >
              {label()}
            </label>
          </Show>

          <Show when={showDescription()}>
            <span
              id={descriptionId()}
              data-slot="description"
              {...resolved.slotClassAndStyle('description')}
            >
              {description()}
            </span>
          </Show>
        </span>
      </Show>
    </div>
  )
}
