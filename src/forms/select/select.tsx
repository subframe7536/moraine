import { Combobox, useComboboxContext } from '@kobalte/core/combobox'
import type { ComboboxRootProps, ComboboxSingleSelectionOptions } from '@kobalte/core/combobox'
import type { JSX } from 'solid-js'
import { Show, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'

import type { SelectControlVariantProps } from './select.class'
import {
  selectClearVariants,
  selectControlVariants,
  selectInputVariants,
  selectLeadingIconVariants,
  selectTriggerIconVariants,
} from './select.class'
import {
  createComboboxInputHandlers,
  createFindOptionByValue,
  createSelectComponents,
  flattenOptions,
  mapNormalizedToRawValue,
  normalizeOptions,
  RenderSelectComboboxFrame,
  RenderSelectClearButton,
  SELECT_COMMON_COMBOBOX_PROPS,
  SELECT_COMMON_DEFAULT_PROPS,
  SELECT_SPLIT_KEYS,
  RenderSelectTriggerButton,
  RenderSelectEmptyNode,
  syncSelectSearchInputValue,
  useSelectField,
  useSelectFilter,
  useSelectMenuControl,
} from './shared'
import type {
  NormalizedGroup as SharedNormalizedGroup,
  NormalizedOption as SharedNormalizedOption,
  SelectControlState as SharedSelectControlState,
} from './shared'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export namespace SelectT {
  export type Value = string | number

  export interface OptionRenderState {
    /** Whether the option is currently selected. */
    isSelected: boolean
    /** Whether the option is currently highlighted/focused. */
    isHighlighted: boolean
    /** Whether the option is disabled. */
    isDisabled: boolean
  }
  export interface EmptyRenderContext {
    /** Current input/search text. */
    inputValue: string
    /** Whether the current filter has any matches. */
    hasMatches: boolean
    /** Currently selected value. */
    selectedValue: Value | null
    /** Close the dropdown menu. */
    close: () => void
  }

  export type Slot =
    | 'root'
    | 'control'
    | 'input'
    | 'leading'
    | 'trigger'
    | 'clear'
    | 'content'
    | 'listbox'
    | 'item'
    | 'itemTrailing'
    | 'itemLabel'
    | 'itemDescription'
    | 'group'
    | 'label'
    | 'empty'

  export type Variant = SelectControlVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = ComboboxRootProps<NormalizedOption, NormalizedGroup>

  export interface Items {
    /** Label to display for the option. */
    label?: string | JSX.Element
    /** Text key used for filtering and matching; set this when `label` is not a string. */
    key?: string
    /** Value of the option. */
    value?: Value
    /** Whether the option is disabled. */
    disabled?: boolean
    /** Description shown below the label. */
    description?: string | JSX.Element
    /** Icon shown next to the label. */
    icon?: IconT.Name
    /** One-layer child options for grouped select. */
    children?: Items[]
  }

  /**
   * Base props for the Select component.
   */
  export interface Base
    extends
      FormIdentityOptions,
      FormValueOptions<SelectT.Value | null>,
      FormRequiredOption,
      FormDisableOption {
    /** Available options. */
    options?: Items[]

    /** Called when the selection changes. */
    onChange?: (value: SelectT.Value | null) => void

    /** Enable search input. Defaults to `false`. */
    search?: boolean
    /** Controlled search value. */
    searchValue?: string
    /** Default search value. */
    defaultSearchValue?: string
    /** Called when the search input changes. */
    onSearch?: (value: string) => void
    /** Maximum search text length applied on final commit. */
    searchMaxLength?: number
    /**
     * Filter function or boolean. `false` disables filtering.
     * @default true
     */
    filterOption?:
      | boolean
      | 'startsWith'
      | 'endsWith'
      | 'contains'
      | ((inputValue: string, option: SelectT.Items) => boolean)
    /**
     * Controls whether clicking the control opens the menu.
     * @default 'control'
     */
    openOnClick?: 'control' | 'trigger'

    /** Show a clear button when a value is selected.
     * @default false
     */
    allowClear?: boolean
    /** Called when clear is triggered. */
    onClear?: () => void

    /** Custom renderer for each option in the dropdown. */
    optionRender?: (option: SelectT.Items & OptionRenderState) => JSX.Element
    /** Custom renderer for the option label text. */
    labelRender?: (option: SelectT.Items) => JSX.Element
    /** Custom renderer for the empty state when current filtered result has no matches. */
    emptyRender?: string | ((context: EmptyRenderContext) => JSX.Element)
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
    triggerIcon?: IconT.Name
    /** Icon shown on the clear button. */
    closeIcon?: IconT.Name

    /** Called when the user scrolls near the bottom of the listbox. Use for infinite loading. */
    onScrollBottom?: () => void
    /** Distance (px) from the bottom at which onScrollBottom fires. Default: 20. */
    scrollBottomThreshold?: number
  }

  /**
   * Props for the Select component.
   */
  export interface Props extends BaseProps<
    Base,
    Variant,
    Extend,
    Slot,
    'multiple' | 'defaultFilter' | 'itemComponent' | 'sectionComponent'
  > {}
}

/**
 * Props for the Select component.
 */
export interface SelectProps extends SelectT.Props {}

type NormalizedOption = SharedNormalizedOption<SelectT.Items>
type NormalizedGroup = SharedNormalizedGroup<SelectT.Items>
type SelectControlState = SharedSelectControlState<SelectT.Items>

/** Dropdown select component with search and custom item rendering. */
export function Select(props: SelectProps): JSX.Element {
  const merged = mergeProps(SELECT_COMMON_DEFAULT_PROPS, props)

  const [local, rest] = splitProps(merged, SELECT_SPLIT_KEYS)

  const field = useSelectField(() => ({
    id: local.id,
    name: local.name,
    size: local.size,
    disabled: local.disabled,
    initialValue: local.defaultValue ?? '',
  }))
  const menuControl = useSelectMenuControl(() => local.openOnClick)

  const isSearchable = createMemo(() => Boolean(local.search))

  // ---- Normalize options for Kobalte ----
  const normalizedOptions = createMemo(() => normalizeOptions(local.options))

  const hasGroups = createMemo(() => normalizedOptions().some((item) => item.isGroup === true))

  const allFlatOptions = createMemo(() => flattenOptions(normalizedOptions()))

  // ---- Input ref for controlled search ----
  let inputRef: HTMLInputElement | undefined

  // ---- Current input text tracking (for create-tag item) ----
  const [currentInputText, setCurrentInputText] = createSignal('')

  syncSelectSearchInputValue(
    local,
    () => inputRef,
    (searchValue) => setCurrentInputText(searchValue),
  )

  const { kobalteFilter, hasMatches } = useSelectFilter<NormalizedOption, SelectT.Items>({
    isSearchable,
    filterOption: () => local.filterOption,
    allOptions: allFlatOptions,
    inputValue: currentInputText,
  })

  // ---- Value lookup ----
  const findOptionByValue = createFindOptionByValue(() => allFlatOptions())

  // ---- Value conversion memos ----
  const kobalteValue = createMemo(() => {
    if (local.value === undefined) {
      return undefined
    }
    if (local.value === null) {
      return null
    }
    return findOptionByValue(local.value as SelectT.Value) ?? null
  })

  const kobalteDefaultValue = createMemo(() => {
    if (local.defaultValue === undefined || local.defaultValue === null) {
      return undefined
    }
    return findOptionByValue(local.defaultValue as SelectT.Value)
  })

  // ---- onChange bridges ----
  function handleSingleChange(option: NormalizedOption | null): void {
    const nextValue = option ? mapNormalizedToRawValue(option) : null

    field.setFormValue(nextValue ?? '')
    local.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  // ---- Input change handler ----
  function handleInputChange(inputValue: string): void {
    if (!menuControl.isDismissing()) {
      setCurrentInputText(inputValue)
    }

    local.onSearch?.(inputValue)
  }

  // ---- Trigger mode ----
  // Use 'manual' so the dropdown only opens on explicit user actions
  // (click, arrow-down, typing in searchable mode) �?never on bare focus.
  // This prevents Tab from retriggering the menu via FocusScope's delayed
  // unmount-auto-focus.

  // ---- Item component ----
  const { ItemComponent, SectionComponent } = createSelectComponents<
    SelectT.Items,
    SelectT.OptionRenderState
  >({
    styles: () => merged.styles,
    size: field.size,
    classes: () => local.classes,
    optionRender: () => local.optionRender,
    labelRender: () => local.labelRender,
  })

  function SelectTriggerContent(props: SelectControlState): JSX.Element {
    const context = useComboboxContext()

    const inputHandlers = createComboboxInputHandlers({
      isSearchable,
      menuControl,
      field,
      context,
      onTabSelection: (key) => context.listState().selectionManager().select(key),
    })

    return (
      <>
        {/* Leading icon */}
        <Show when={local.leadingIcon}>
          {(icon) => (
            <Icon
              name={icon()}
              size={field.size()}
              slotName="leading"
              style={merged.styles?.leading}
              class={selectLeadingIconVariants({ size: field.size() }, local.classes?.leading)}
            />
          )}
        </Show>

        <Combobox.Input
          ref={(el: HTMLInputElement) => {
            inputRef = el
          }}
          data-slot="input"
          data-readonly={!isSearchable()}
          style={merged.styles?.input}
          class={selectInputVariants(
            {
              mode: 'single',
              size: field.size(),
            },
            menuControl.opensFromControlClick()
              ? 'data-readonly:cursor-pointer'
              : 'data-readonly:cursor-default',
            local.classes?.input,
          )}
          readOnly={!isSearchable()}
          maxLength={local.searchMaxLength}
          {...inputHandlers}
        />

        <RenderSelectClearButton
          show={Boolean(local.allowClear && props.selectedOptions().length > 0)}
          size={field.size()}
          style={merged.styles?.clear}
          rootClass={selectClearVariants({ size: field.size() }, local.classes?.clear)}
          onClick={(event) => {
            event.stopPropagation()
            field.handleClear(props.clear, local.onClear)
          }}
        />

        <RenderSelectTriggerButton
          style={merged.styles?.trigger}
          name={local.triggerIcon}
          size={field.size()}
          rootClass={selectTriggerIconVariants({ size: field.size() }, local.classes?.trigger)}
          loading={local.loading}
          loadingIcon={local.loadingIcon}
          onClick={(event) => menuControl.onTriggerClickFallback(event, context)}
        />
      </>
    )
  }

  function SelectEmptyNode(): JSX.Element {
    const context = useComboboxContext()

    return (
      <RenderSelectEmptyNode<SelectT.EmptyRenderContext>
        emptyRender={local.emptyRender}
        style={merged.styles?.empty}
        class={local.classes?.empty}
        context={() => ({
          inputValue: currentInputText(),
          hasMatches: hasMatches(),
          selectedValue: (() => {
            const selected = kobalteValue()
            if (!selected) {
              return null
            }
            return mapNormalizedToRawValue(selected)
          })(),
          close: () => context.close(),
        })}
      />
    )
  }

  const singleSelectionProps = createMemo<ComboboxSingleSelectionOptions<NormalizedOption>>(() => ({
    multiple: false,
    value: kobalteValue(),
    defaultValue: kobalteDefaultValue(),
    onChange: handleSingleChange,
  }))

  // ---- Render ----
  return (
    <Combobox<NormalizedOption, NormalizedGroup>
      id={field.id()}
      name={field.name()}
      options={normalizedOptions()}
      {...SELECT_COMMON_COMBOBOX_PROPS}
      optionGroupChildren={hasGroups() ? 'options' : undefined}
      placeholder={local.placeholder}
      onInputChange={handleInputChange}
      defaultFilter={kobalteFilter()}
      disabled={field.disabled()}
      required={local.required}
      validationState={field.invalid() ? 'invalid' : 'valid'}
      virtualized={local.virtualized}
      itemComponent={local.virtualized ? undefined : ItemComponent}
      sectionComponent={local.virtualized ? undefined : SectionComponent}
      {...singleSelectionProps()}
      closeOnSelection={true}
      style={merged.styles?.root}
      class={cn('inline-flex h-fit w-full relative', local.classes?.root)}
      {...field.ariaAttrs()}
      {...rest}
    >
      <RenderSelectComboboxFrame<SelectT.Items>
        controlStyle={merged.styles?.control}
        controlClass={selectControlVariants(
          {
            size: field.size(),
            variant: local.variant,
          },
          menuControl.opensFromControlClick() ? 'cursor-pointer' : 'cursor-default',
          local.classes?.control,
        )}
        invalid={Boolean(field.invalid())}
        disabled={Boolean(field.disabled())}
        renderTriggerContent={(state) => <SelectTriggerContent {...state} />}
        hasMatches={hasMatches}
        emptyNode={<SelectEmptyNode />}
        virtualized={Boolean(local.virtualized)}
        contentStyle={merged.styles?.content}
        contentClass={local.classes?.content}
        listboxStyle={merged.styles?.listbox}
        listboxClass={local.classes?.listbox}
        onContentInteractOutside={menuControl.onContentInteractOutside}
        onContentCloseAutoFocus={menuControl.onContentCloseAutoFocus}
        onListboxScrollBottom={local.onScrollBottom}
        scrollBottomThreshold={local.scrollBottomThreshold}
        sectionComponent={SectionComponent}
        itemComponent={ItemComponent}
      />
    </Combobox>
  )
}
