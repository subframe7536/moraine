import * as KobalteCheckbox from '@kobalte/core/checkbox'
import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { useFormField } from '../form-field/form-field-context'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import { cn, useId } from '../shared/utils'

import type { CheckboxVariantProps } from './checkbox.class'
import {
  checkboxBaseVariants,
  checkboxContainerVariants,
  checkboxDescriptionVariants,
  checkboxIconVariants,
  checkboxIndicatorVariants,
  checkboxLabelVariants,
  checkboxRootVariants,
  checkboxWrapperVariants,
} from './checkbox.class'

type CheckboxColor = NonNullable<CheckboxVariantProps['color']>
type CheckboxSize = NonNullable<CheckboxVariantProps['size']>

export interface CheckboxClasses {
  container?: string
  base?: string
  indicator?: string
  icon?: string
  wrapper?: string
  label?: string
  description?: string
}

export interface CheckboxBaseProps extends CheckboxVariantProps {
  id?: string
  name?: string
  label?: JSX.Element
  description?: JSX.Element
  formFieldBind?: boolean
  checkedIcon?: IconName
  indeterminateIcon?: IconName
  class?: string
  classes?: CheckboxClasses
}

export type CheckboxProps = CheckboxBaseProps &
  Omit<KobalteCheckbox.CheckboxRootProps, keyof CheckboxBaseProps | 'children'>

function normalizeCheckboxColor(value?: string): CheckboxColor {
  if (value === 'secondary' || value === 'neutral' || value === 'error') {
    return value
  }

  return 'primary'
}

function normalizeCheckboxSize(value?: string): CheckboxSize {
  if (value === 'xs' || value === 'sm' || value === 'lg' || value === 'xl') {
    return value
  }

  return 'md'
}

export function Checkbox(props: CheckboxProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      color: 'primary' as const,
      variant: 'list' as const,
      indicator: 'start' as const,
      checkedIcon: 'icon-check' as IconName,
      indeterminateIcon: 'icon-minus' as IconName,
      formFieldBind: true,
    },
    props,
  )

  const [local, rest] = splitProps(merged as CheckboxProps, [
    'id',
    'name',
    'label',
    'description',
    'formFieldBind',
    'checked',
    'defaultChecked',
    'indeterminate',
    'required',
    'disabled',
    'readOnly',
    'value',
    'onChange',
    'size',
    'color',
    'variant',
    'indicator',
    'checkedIcon',
    'indeterminateIcon',
    'class',
    'classes',
  ])

  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      color: local.color,
      disabled: local.disabled,
    }),
    () => ({
      bind: local.formFieldBind,
    }),
  )
  const generatedId = useId(() => local.id, 'checkbox')

  const inputId = createMemo(() => field.id() ?? generatedId())
  const rootId = createMemo(() => `${inputId()}-root`)
  const resolvedColor = createMemo(() => normalizeCheckboxColor(field.color() ?? local.color))
  const resolvedSize = createMemo(() => normalizeCheckboxSize(field.size() ?? local.size))
  const disabled = createMemo(() => field.disabled())
  const ariaAttrs = createMemo(() => field.ariaAttrs() ?? {})

  function onChange(nextChecked: boolean): void {
    local.onChange?.(nextChecked)
    field.emitFormChange()
    field.emitFormInput()
  }

  return (
    <KobalteCheckbox.Root
      id={rootId()}
      name={field.name()}
      value={local.value}
      checked={local.checked}
      defaultChecked={local.defaultChecked}
      indeterminate={local.indeterminate}
      required={local.required}
      disabled={disabled()}
      readOnly={local.readOnly}
      onChange={onChange}
      data-slot="root"
      class={cn(
        checkboxRootVariants({
          variant: local.variant,
          indicator: local.indicator,
          size: resolvedSize(),
          disabled: disabled(),
        }),
        local.class,
      )}
      {...rest}
    >
      {(state) => (
        <>
          <div
            data-slot="container"
            class={cn(
              checkboxContainerVariants({
                size: resolvedSize(),
              }),
              local.classes?.container,
            )}
          >
            <KobalteCheckbox.Input
              id={inputId()}
              data-slot="input"
              {...(ariaAttrs() as Record<string, string | boolean | undefined>)}
            />

            <KobalteCheckbox.Control
              data-slot="base"
              class={cn(
                checkboxBaseVariants({
                  size: resolvedSize(),
                  disabled: disabled(),
                }),
                local.indicator === 'hidden' && 'sr-only',
                local.classes?.base,
              )}
            >
              <KobalteCheckbox.Indicator
                data-slot="indicator"
                class={cn(
                  checkboxIndicatorVariants({
                    color: resolvedColor(),
                  }),
                  local.classes?.indicator,
                )}
              >
                <Show
                  when={state.indeterminate()}
                  fallback={
                    <Icon
                      name={local.checkedIcon}
                      class={cn(
                        checkboxIconVariants({
                          size: resolvedSize(),
                        }),
                        local.classes?.icon,
                      )}
                    />
                  }
                >
                  <Icon
                    name={local.indeterminateIcon}
                    class={cn(
                      checkboxIconVariants({
                        size: resolvedSize(),
                      }),
                      local.classes?.icon,
                    )}
                  />
                </Show>
              </KobalteCheckbox.Indicator>
            </KobalteCheckbox.Control>
          </div>

          <Show when={local.label || local.description}>
            <div
              data-slot="wrapper"
              class={cn(
                checkboxWrapperVariants({
                  indicator: local.indicator,
                  size: resolvedSize(),
                }),
                local.classes?.wrapper,
              )}
            >
              <Show when={local.label}>
                <label
                  for={inputId()}
                  data-slot="label"
                  class={cn(
                    checkboxLabelVariants({
                      required: local.required,
                      disabled: disabled(),
                    }),
                    local.classes?.label,
                  )}
                >
                  {local.label}
                </label>
              </Show>

              <Show when={local.description}>
                <p
                  data-slot="description"
                  class={cn(
                    checkboxDescriptionVariants({
                      disabled: disabled(),
                    }),
                    local.classes?.description,
                  )}
                >
                  {local.description}
                </p>
              </Show>
            </div>
          </Show>
        </>
      )}
    </KobalteCheckbox.Root>
  )
}
