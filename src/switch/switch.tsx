import * as KobalteSwitch from '@kobalte/core/switch'
import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { useFormField } from '../form-field/form-field-context'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import { cn, useId } from '../shared/utils'

import type { SwitchVariantProps } from './switch.class'
import {
  switchBaseVariants,
  switchContainerVariants,
  switchDescriptionVariants,
  switchIconVariants,
  switchLabelVariants,
  switchRootVariants,
  switchThumbVariants,
  switchWrapperVariants,
} from './switch.class'

type SwitchColor = NonNullable<SwitchVariantProps['color']>
type SwitchSize = NonNullable<SwitchVariantProps['size']>

export interface SwitchClasses {
  root?: string
  container?: string
  base?: string
  thumb?: string
  icon?: string
  wrapper?: string
  label?: string
  description?: string
}

export interface SwitchBaseProps extends SwitchVariantProps {
  id?: string
  name?: string
  loading?: boolean
  loadingIcon?: IconName
  checkedIcon?: IconName
  uncheckedIcon?: IconName
  label?: JSX.Element
  description?: JSX.Element
  classes?: SwitchClasses
}

export type SwitchProps = SwitchBaseProps &
  Omit<KobalteSwitch.SwitchRootProps, keyof SwitchBaseProps | 'children' | 'class'>

function normalizeSwitchColor(value?: string): SwitchColor {
  if (value === 'secondary' || value === 'neutral' || value === 'error') {
    return value
  }

  return 'primary'
}

function normalizeSwitchSize(value?: string): SwitchSize {
  if (value === 'xs' || value === 'sm' || value === 'lg' || value === 'xl') {
    return value
  }

  return 'md'
}

export function Switch(props: SwitchProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      color: 'primary' as const,
      loading: false,
      loadingIcon: 'icon-loading' as IconName,
    },
    props,
  )

  const [local, rest] = splitProps(merged as SwitchProps, [
    'id',
    'name',
    'checked',
    'defaultChecked',
    'required',
    'disabled',
    'readOnly',
    'value',
    'onChange',
    'loading',
    'loadingIcon',
    'checkedIcon',
    'uncheckedIcon',
    'size',
    'color',
    'label',
    'description',
    'classes',
  ])

  const field = useFormField(() => ({
    id: local.id,
    name: local.name,
    size: local.size,
    color: local.color,
    disabled: local.disabled || local.loading,
  }))
  const generatedId = useId(() => local.id, 'switch')

  const inputId = createMemo(() => field.id() ?? generatedId())
  const rootId = createMemo(() => `${inputId()}-root`)
  const resolvedColor = createMemo(() => normalizeSwitchColor(field.color() ?? local.color))
  const resolvedSize = createMemo(() => normalizeSwitchSize(field.size() ?? local.size))
  const disabled = createMemo(() => field.disabled())
  const ariaAttrs = createMemo(() => field.ariaAttrs() ?? {})

  function onChange(nextChecked: boolean): void {
    local.onChange?.(nextChecked)
    field.emitFormChange()
    field.emitFormInput()
  }

  return (
    <KobalteSwitch.Root
      id={rootId()}
      name={field.name()}
      value={local.value}
      checked={local.checked}
      defaultChecked={local.defaultChecked}
      required={local.required}
      disabled={disabled()}
      readOnly={local.readOnly}
      onChange={onChange}
      data-slot="root"
      class={cn(
        switchRootVariants({
          disabled: disabled(),
        }),
        local.classes?.root,
      )}
      {...rest}
    >
      {(state) => {
        const checked = createMemo(() => state.checked())
        const iconName = createMemo<IconName | undefined>(() => {
          if (local.loading) {
            return local.loadingIcon
          }

          if (checked()) {
            return local.checkedIcon
          }

          return local.uncheckedIcon
        })

        return (
          <>
            <div
              data-slot="container"
              class={cn(
                switchContainerVariants({
                  size: resolvedSize(),
                }),
                local.classes?.container,
              )}
            >
              <KobalteSwitch.Input id={inputId()} data-slot="input" {...ariaAttrs()} />

              <KobalteSwitch.Control
                data-slot="base"
                class={cn(
                  switchBaseVariants({
                    color: resolvedColor(),
                    size: resolvedSize(),
                    disabled: disabled(),
                  }),
                  local.classes?.base,
                )}
              >
                <KobalteSwitch.Thumb
                  data-slot="thumb"
                  class={cn(
                    switchThumbVariants({
                      size: resolvedSize(),
                    }),
                    local.classes?.thumb,
                  )}
                >
                  <Show when={iconName()}>
                    {(resolvedIconName) => (
                      <Icon
                        name={resolvedIconName()}
                        classes={{
                          root: cn(
                            switchIconVariants({
                              color: resolvedColor(),
                              checked: !local.loading && checked(),
                              unchecked: !local.loading && !checked(),
                              loading: local.loading,
                            }),
                            local.classes?.icon,
                          ),
                        }}
                      />
                    )}
                  </Show>
                </KobalteSwitch.Thumb>
              </KobalteSwitch.Control>
            </div>

            <Show when={local.label || local.description}>
              <div
                data-slot="wrapper"
                class={cn(
                  switchWrapperVariants({
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
                      switchLabelVariants({
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
                      switchDescriptionVariants({
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
        )
      }}
    </KobalteSwitch.Root>
  )
}
