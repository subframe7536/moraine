import type { Component, JSX } from 'solid-js'
import { Show } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options.ts'

import { BaseSelect } from './base-select.tsx'
import type { BaseSelectT } from './base-select.tsx'
import type { SelectControlVariantProps } from './select.class.ts'
import {
  selectControlVariants,
  selectInputVariants,
  selectLeadingIconVariants,
  selectTriggerIconVariants,
} from './select.class.ts'
import {
  createEmptyRenderer,
  findNormalizedOptionByValue,
  mapNormalizedToRawValue,
  renderDefaultSelectOption,
} from './shared/index.ts'
import type { NormalizedOption } from './shared/index.ts'

export namespace SelectT {
  export type Value = string | number

  export type OptionRenderState = BaseSelectT.OptionRenderState
  export type VirtualEntry<TItem extends Value = Value> = BaseSelectT.VirtualEntry<Item<TItem>>
  export type VirtualRenderProps<TItem extends Value = Value> = BaseSelectT.VirtualRenderProps<
    Item<TItem>
  >
  export interface ControlSlot<T = unknown> {
    /** Closed select control that displays the current value and opens the popup. */
    control?: T
    /** Search input or value text field inside the control. */
    input?: T
    /** Icon shown before the select input or value. */
    leading?: T
    /** Button region that toggles the select popup. */
    trigger?: T
  }
  export interface OptionSlot<T = unknown> {
    /** Message shown when filtering leaves no selectable options. */
    empty?: T
    /** Primary label text inside an option row. */
    itemLabel?: T
    /** Supporting description text inside an option row. */
    itemDescription?: T
    /** Trailing region inside an option row, usually for selection state or custom content. */
    itemTrailing?: T
  }

  export interface OptionRenderProps<TItem extends Value = Value> {
    /** Option and interaction state, or null when no option matches. */
    option: (Item<TItem> & OptionRenderState) | null
  }

  export interface LabelRenderProps<TItem extends Value = Value> {
    /** Option whose label is being rendered. */
    option: Item<TItem>
  }

  export interface EmptyRenderProps<TItem extends Value = Value> {
    /** Current input/search text. */
    inputValue: string
    /** Whether the current filter has any matches. */
    hasMatches: boolean
    /** Currently selected value. */
    selectedValue: TItem | null
    /** Close the dropdown menu. */
    close: () => void
  }

  export interface Slot<T = unknown> extends BaseSelectT.Slot<T>, ControlSlot<T>, OptionSlot<T> {}
  export type Variant = SelectControlVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item<Val extends Value = Value> extends BaseSelectT.Item<Val> {}

  export interface Base<TItem extends Value = Value>
    extends
      Omit<
        BaseSelectT.Base<Item<TItem>>,
        | 'children'
        | 'closeOnSelect'
        | 'emptyRender'
        | 'initialValue'
        | 'onInputKeyDown'
        | 'onOptionSelect'
        | 'optionRender'
        | 'selectedValues'
        | 'multiple'
        | 'tabSelectionBehavior'
        | 'virtualRender'
        | 'scrollToItem'
      >,
      FormIdentityOptions,
      FormValueOptions<TItem | null>,
      FormRequiredOption,
      FormDisableOption {
    /** Called when the selection changes. */
    onChange?: (value: NoInfer<TItem | null>) => void
    /** Renders flattened group labels and options through a virtualization layer. */
    virtualRender?: Component<VirtualRenderProps<TItem>>
    /** Scrolls a highlighted option into view using its flattened entry index. */
    scrollToItem?: (item: Item<TItem>, entryIndex: number) => void
    /** Custom renderer for each option in the dropdown. Passes `null` for empty state. */
    optionRender?: ComponentOrElement<OptionRenderProps<TItem>>
    /** Custom renderer for the option label text. */
    labelRender?: ComponentOrElement<LabelRenderProps<TItem>>
    /** Custom renderer for the empty state when current filtered result has no matches. */
    emptyRender?: ComponentOrElement<EmptyRenderProps<TItem>>
    /**
     * Placeholder text shown when no value is selected.
     * @default ''
     */
    placeholder?: string
    /** Whether the select is in a loading state. */
    loading?: boolean
    /**
     * Icon shown during loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /** Icon shown before the input/value area. */
    leadingIcon?: IconT.Name
    /**
     * Icon for the dropdown trigger.
     * @default 'icon-chevron-down'
     */
    trailingIcon?: IconT.Name
    /** Icon kept for API compatibility; Select has no clear action. */
    closeIcon?: IconT.Name
  }

  export type Props<TItem extends Value = Value> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export interface SelectProps<
  TItem extends SelectT.Value = SelectT.Value,
> extends SelectT.Props<TItem> {}

/** Dropdown select component with search and custom item rendering. */
export function Select<TItem extends SelectT.Value = SelectT.Value>(
  props: SelectProps<TItem>,
): JSX.Element {
  type Item = SelectT.Item<TItem>
  const [selectedValue, setSelectedValue] = useControllableValue<TItem | null>({
    value: () => props.value,
    defaultValue: () => props.defaultValue ?? null,
  })

  function getInitialValue(): TItem | '' {
    return props.defaultValue === null || props.defaultValue === undefined ? '' : props.defaultValue
  }

  function getSelectedValues(): TItem[] {
    const value = selectedValue()
    return value === null || value === undefined ? [] : [value]
  }

  function findSelectedOption(
    api: Pick<BaseSelectT.StateApi<Item>, 'allFlatOptions'>,
  ): NormalizedOption<Item> | null {
    const value = selectedValue()
    return findNormalizedOptionByValue(api.allFlatOptions(), value) ?? null
  }

  function updateSelection(
    option: NormalizedOption<Item> | null,
    api: BaseSelectT.OptionSelectContext<Item>,
  ): void {
    const nextValue = option ? (mapNormalizedToRawValue(option) as TItem) : null
    setSelectedValue(nextValue)
    api.setInputValue(option?.key ?? '')
    api.field.setFormValue(nextValue ?? '')
    props.onChange?.(nextValue)
    api.field.emit('change')
    api.field.emit('input')
  }

  function displayValue(api: BaseSelectT.StateApi<Item>): string | JSX.Element {
    const selected = findSelectedOption(api)
    return selected ? (selected.label ?? selected.key) : props.placeholder
  }

  function renderDefaultOption(option: (Item & SelectT.OptionRenderState) | null): JSX.Element {
    return renderDefaultSelectOption({
      option,
      classes: props.classes,
      styles: props.styles,
      labelRender: props.labelRender,
    })
  }

  return (
    <BaseSelect<Item>
      {...props}
      initialValue={getInitialValue()}
      multiple={false}
      selectedValues={getSelectedValues()}
      onOptionSelect={(option, api) => updateSelection(option, api)}
      emptyRender={createEmptyRenderer({
        emptyRender: props.emptyRender,
        buildProps: (api: BaseSelectT.StateApi<Item>) => {
          return {
            get inputValue() {
              return api.inputValue()
            },
            get hasMatches() {
              return api.visibleFlatOptions().length > 0
            },
            get selectedValue() {
              const selected = findSelectedOption(api)
              return selected ? (mapNormalizedToRawValue(selected) as TItem) : null
            },
            close: api.close,
          }
        },
      })}
      optionRender={(renderProps) => (
        <Show
          when={props.optionRender !== undefined}
          fallback={renderDefaultOption(renderProps.option)}
        >
          {renderComponentOrElement(props.optionRender, {
            get option() {
              return renderProps.option
            },
          })}
        </Show>
      )}
    >
      {(api) => {
        return (
          <div
            data-slot="control"
            data-disabled={api.field.disabled() ? '' : undefined}
            data-invalid={api.field.invalid() ? '' : undefined}
            data-required={props.required ? '' : undefined}
            style={props.styles?.control}
            class={selectControlVariants(
              { variant: props.variant, search: api.isSearchable() },
              props.classes?.control,
            )}
            {...api.controlProps()}
          >
            <Show when={props.leadingIcon}>
              {(icon) => (
                <Icon
                  name={icon()}
                  size={api.field.size()}
                  slotName="leading"
                  style={props.styles?.leading}
                  class={selectLeadingIconVariants(
                    { size: api.field.size() },
                    props.classes?.leading,
                  )}
                />
              )}
            </Show>

            <Show
              when={api.isSearchable()}
              fallback={
                <span
                  data-slot="input"
                  style={props.styles?.input}
                  class={selectInputVariants(
                    {
                      mode: 'single',
                      size: api.field.size(),
                    },
                    'text-start truncate',
                    !selectedValue() && 'text-muted-foreground',
                    props.classes?.input,
                  )}
                >
                  {displayValue(api)}
                </span>
              }
            >
              <input
                data-slot="input"
                style={props.styles?.input}
                class={selectInputVariants(
                  {
                    mode: 'single',
                    size: api.field.size(),
                  },
                  props.classes?.input,
                )}
                placeholder={props.placeholder}
                {...api.inputProps()}
                onInput={(event) => {
                  api.setInputValue(event.currentTarget.value)
                  api.onInput(event)
                }}
              />
            </Show>

            <Icon
              name={
                props.loading
                  ? (props.loadingIcon ?? 'icon-loading')
                  : (props.trailingIcon ?? 'icon-chevron-down')
              }
              slotName="trigger"
              data-loading={props.loading ? '' : undefined}
              class={selectTriggerIconVariants(
                { size: api.field.size() },
                props.loading ? 'effect-loading' : undefined,
                props.classes?.trigger,
              )}
              style={props.styles?.trigger}
            />
          </div>
        )
      }}
    </BaseSelect>
  )
}
