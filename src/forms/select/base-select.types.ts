import type { Accessor, Component, JSX, Ref, ValidComponent } from 'solid-js'

import type { IconT } from '../../elements/icon'
import type { ListT } from '../../elements/list'
import type { createComponentStyles } from '../../shared/provider/create-component-styles'
import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, ElementProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { UseFormFieldReturn } from '../form/form-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options'

import type { BaseSelectItems, NormalizedOption } from './shared'

export namespace BaseSelectT {
  export type Kind = 'composite'

  export type Value = string | number

  export interface ItemState {
    /** Whether the option is currently selected. */
    isSelected: boolean
    /** Whether the option is currently highlighted/focused. */
    isHighlighted: boolean
    /** Whether the option is disabled. */
    isDisabled: boolean
  }

  export type OptionRenderState = ItemState

  export interface Item<Val extends Value = Value> extends BaseSelectItems<Item<Val>> {
    /** Label to display for the option, or the option group title. */
    label?: string | JSX.Element
    /** Text key used for filtering and matching; set this when `label` is not a string. */
    key?: string
    /** Unique item value. Required for selectable options, omitted for group headings. */
    value?: Val
    /** Whether the option cannot be selected. */
    disabled?: boolean
    /** Description shown below the label. */
    description?: string | JSX.Element
    /** Icon shown next to the label. */
    icon?: IconT.Name
    /** Leading icon or adornment. */
    leading?: JSX.Element
    /** One-layer child options for grouped select. */
    children?: Omit<Item<Val>, 'children'>[]
  }

  export interface StateApi<TItem extends Item = Item> {
    allFlatOptions: Accessor<NormalizedOption<TItem>[]>
    close: () => void
    field: UseFormFieldReturn
    highlightedKey: Accessor<string | undefined>
    inputValue: Accessor<string>
    isOpen: Accessor<boolean>
    setInputValue: (value: string) => void
    visibleFlatOptions: Accessor<NormalizedOption<TItem>[]>
  }

  export interface ControlApi<TItem extends Item = Item> extends StateApi<TItem> {
    controlProps: Accessor<JSX.HTMLAttributes<HTMLDivElement>>
    focusInput: () => void
    inputProps: Accessor<JSX.InputHTMLAttributes<HTMLInputElement>>
    isSearchable: Accessor<boolean>
    onInput: (event: InputEvent) => void
    onKeyDown: (event: KeyboardEvent) => void
    toggle: () => void
    resolved: ReturnType<typeof createComponentStyles<'select' | 'baseSelect'>>
  }

  export interface OptionSelectContext<TItem extends Item = Item> {
    allFlatOptions: Accessor<NormalizedOption<TItem>[]>
    field: UseFormFieldReturn
    setInputValue: (value: string) => void
  }

  export interface VirtualLabelEntry {
    /** Structural entry rendered before a grouped option collection. */
    type: 'label'
    /** Stable label group key. */
    key: string
    /** Rendered group label text or node. */
    label: JSX.Element
    /** Normalized option keys owned by this group. */
    optionKeys: string[]
  }

  export interface VirtualItemEntry<TItem extends Item = Item> {
    /** Selectable option entry. */
    type: 'item'
    /** Stable normalized option key. */
    key: string
    /** Source option passed to Select or MultiSelect. */
    item: TItem
    /** Whether the option cannot be selected. */
    disabled: boolean
  }

  export type VirtualEntry<TItem extends Item = Item> = VirtualLabelEntry | VirtualItemEntry<TItem>

  export type VirtualRenderProps<TItem extends Item = Item> = ListT.VirtualRenderProps<
    VirtualEntry<TItem>,
    HTMLDivElement,
    HTMLDivElement
  >

  export interface Slot<T = unknown> {
    /** Select root that owns open state, value display, and popup positioning. */
    root?: T
    /** Trigger surface that users interact with to open the dropdown. */
    control?: T
    /** Input element for searching or displaying current value. */
    input?: T
    /** Clear action button. */
    clear?: T
    /** Trailing indicator/chevron icon. */
    trigger?: T
    /** Leading icon or adornment. */
    leading?: T
    /** Popup panel that contains search input, options, groups, and empty state. */
    content?: T
    /** ARIA listbox that contains selectable options. */
    listbox?: T
    /** Selectable option row inside the listbox. */
    item?: T
    /** Option group wrapper inside the listbox. */
    group?: T
    /** Group label or option label text, depending on context. */
    label?: T
    /** Visual separator between options or groups. */
    separator?: T
    /** Empty state placeholder inside listbox when no options match. */
    empty?: T
  }

  export interface Variant {
    /** Visual size of the options menu items. @default 'md' */
    size?: 'sm' | 'md' | 'lg'
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base<TItem extends Item = Item>
    extends FormIdentityOptions, FormRequiredOption, FormDisableOption, FormReadOnlyOption {
    /** Available options. */
    options?: TItem[]
    /** Controlled open state. */
    open?: boolean
    /**
     * Initial open state.
     * @default false
     */
    defaultOpen?: boolean
    /** Called whenever the popup open state changes. */
    onOpenChange?: (open: boolean) => void
    /** Renders flattened group labels and options through a caller-provided virtualization layer. */
    virtualRender?: Component<VirtualRenderProps<TItem>>
    /** Scrolls a highlighted raw option into view using its flattened entry index. */
    scrollToItem?: (item: TItem, entryIndex: number) => void
    /** Additional attributes for the listbox element. */
    listboxProps?: ElementProps<HTMLDivElement>
    /** Additional attributes for an option row. */
    itemProps?: (option: TItem & ItemState) => ElementProps<HTMLDivElement> | undefined
    /** Whether search filtering is enabled. */
    search?: boolean
    /** Controlled search value. */
    searchValue?: string
    /**
     * Default search value.
     * @default ''
     */
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
      | ((inputValue: string, option: TItem) => boolean)
    /**
     * Current selected values used only to derive selected option state.
     * @default []
     */
    selectedValues?: Value[]
    /** Internal flag that selects native single or multiple form semantics. */
    multiple?: boolean
    /** Form value used when the field initializes. */
    initialValue?: unknown
    /** Render the trigger/control surface, or composite child elements. */
    children?: JSX.Element | ((api: ControlApi<TItem>) => JSX.Element)
    /** Called when an option is selected by pointer or keyboard. */
    onOptionSelect?: (
      option: NormalizedOption<TItem> | null,
      context: OptionSelectContext<TItem>,
    ) => void
    /** Form reset callback used by wrappers or consumers. */
    onFormReset?: (context: OptionSelectContext<TItem>) => void
    /** Whether the value is externally controlled. */
    isValueControlled?: boolean
    /** Pre-resolved component styles passed from higher-level wrappers like Select / MultiSelect. */
    resolvedStyles?: ReturnType<typeof createComponentStyles<'select' | 'baseSelect'>>
    /**
     * Called on option item keydown. Can be used to intercept keys for custom behavior.
     */
    onInputKeyDown?: (event: KeyboardEvent, context: StateApi<TItem>) => void
    /**
     * Called when the listbox is scrolled to bottom. Useful for infinite loading scenarios.
     */
    onScrollBottom?: () => void
    /**
     * Distance (px) from the bottom at which onScrollBottom fires.
     * @default 20
     */
    scrollBottomThreshold?: number
    /**
     * Padding (px) used when calculating popup overflow and viewport collision.
     * @default 4
     */
    overflowPadding?: number
    /**
     * Gap (px) between the control and popup content.
     * @default 0
     */
    gutter?: number
    /**
     * Whether the select closes after selection.
     * @default true
     */
    closeOnSelect?: boolean
  }

  export type Props<TItem extends Item = Item> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >

  export type ControlBase<TItem extends Item = Item> = {
    children?: JSX.Element | ((props: ControlApi<TItem>) => JSX.Element)
  }

  export type ControlProps<TItem extends Item = Item> = BaseProps<
    'div',
    ControlBase<TItem>,
    never,
    never,
    never
  >

  export type InputBase<T extends ValidComponent = 'input'> = {
    as?: T
    placeholder?: string
    children?: JSX.Element
    ref?: Ref<any>
    onInput?: JSX.EventHandlerUnion<any, InputEvent>
  }

  export type InputProps<T extends ValidComponent = 'input'> = BaseProps<
    T,
    InputBase<T>,
    never,
    never,
    never
  >

  export type ClearBase = {
    children?: JSX.Element
    icon?: IconT.Name
  }

  export type ClearProps = BaseProps<'button', ClearBase, never, never, never>

  export type TriggerElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T]
    : HTMLElement

  export type TriggerBase<T extends ValidComponent = 'button', TItem extends Item = Item> = {
    /** Element or component to render as. @default 'button' */
    as?: T
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : T extends 'button'
        ? JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
        : T extends 'input'
          ? JSX.InputHTMLAttributes<HTMLInputElement>['type']
          : JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
    /** Whether this trigger is disabled. */
    disabled?: boolean
    /** Trigger content. */
    children?: JSX.Element | ((props: ControlApi<TItem>) => JSX.Element)
  }

  export type TriggerProps<
    T extends ValidComponent = 'button',
    TItem extends Item = Item,
  > = BaseProps<T, TriggerBase<T, TItem>, never, never, never>

  export type ContentBase = {
    children?: JSX.Element
    positionerClass?: string
    positionerStyle?: JSX.CSSProperties
  }

  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>

  export interface ListboxItemRenderProps<TItem extends Item = Item> {
    /** Option and interaction state, or null when no option matches. */
    option: (TItem & ItemState) | null
  }

  export type ListboxBase<TItem extends Item = Item> = {
    children?: JSX.Element
    /** Custom renderer for options when rendered by default listbox. */
    itemRender?: ComponentOrElement<ListboxItemRenderProps<TItem>>
    /** Custom rendered empty state when rendered by default listbox. */
    emptyRender?: ComponentOrElement<StateApi<TItem>>
  }

  export type ListboxProps<TItem extends Item = Item> = BaseProps<
    'div',
    ListboxBase<TItem>,
    never,
    never,
    never
  >

  export type ItemBase = {
    value?: Value
    disabled?: boolean
    children?: JSX.Element
  }

  export type ItemProps = BaseProps<'div', ItemBase, never, never, never>

  export type GroupBase = {
    children?: JSX.Element
  }

  export type GroupProps = BaseProps<'div', GroupBase, never, never, never>

  export type LabelBase = {
    children?: JSX.Element
  }

  export type LabelProps = BaseProps<'span', LabelBase, never, never, never>

  export type GroupLabelBase = LabelBase

  export type GroupLabelProps = LabelProps

  export type SeparatorBase = {
    children?: JSX.Element
  }

  export type SeparatorProps = BaseProps<'div', SeparatorBase, never, never, never>

  export type EmptyBase = {
    children?: JSX.Element
  }

  export type EmptyProps = BaseProps<'div', EmptyBase, never, never, never>
}

export interface BaseSelectProps<
  TItem extends BaseSelectT.Item = BaseSelectT.Item,
> extends BaseSelectT.Props<TItem> {
  ref?: Ref<HTMLDivElement>
}
