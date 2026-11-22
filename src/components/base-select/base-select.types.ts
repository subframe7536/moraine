import type { Placement } from '@floating-ui/dom'
import type { Accessor, Component, JSX } from 'solid-js'

import type { BaseProps, ElementProps, ValidComponent } from '../../shared/types'
import type {
  OverlayAlign,
  OverlayPlacement,
  SlotClassValue,
  SlotStyleValue,
} from '../../theme/style-types'
import type { FieldT } from '../field'
import type {
  OverlayDisclosureProps,
  OverlayDismissProps,
  OverlayPositionProps,
} from '../shared/overlay/types'

import type { BaseSelectStyleSlot, BaseSelectStyleVariants } from './base-select.style-types'

export type BaseSelectValue = string | number

/**
 * Controlled and uncontrolled popup state.
 * @internal
 */
export interface BaseSelectDisclosureProps extends OverlayDisclosureProps {
  /**
   * Controlled popup state. `undefined` keeps it uncontrolled. In controlled mode the popup
   * opens or closes only when you update this prop in `onOpenChange`. Page scrolling is locked
   * while the popup is open.
   */
  open?: boolean

  /**
   * Initial popup state when `open` is not set.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Called with the next state whenever the popup should open or close (typing, arrow keys,
   * selecting an item, `Escape`, `Tab`, or an outside press). Not called when the state would not
   * change. A disabled select never opens.
   */
  onOpenChange?: (open: boolean) => void
}

/**
 * Popup positioning and dismissal shared by BaseSelect and its visual wrappers.
 * @internal
 */
export interface BaseSelectPopupProps extends OverlayDismissProps, OverlayPositionProps {
  /**
   * Locks body scroll while the popup is open. Set `false` to keep the page scrollable.
   * @default true
   */
  preventScroll?: boolean

  /**
   * Preferred side of the anchor (the control) on which the popup opens. Combined with `align`;
   * see `flip` for when the side can change.
   * @default 'bottom'
   */
  placement?: OverlayPlacement
  /**
   * Alignment of the popup along the anchor's edge: `'start'`, `'center'`, or `'end'`.
   * @default 'start'
   */
  align?: OverlayAlign
  /**
   * Gap in pixels between anchor and popup.
   * @default 4
   */
  gutter?: number
  /**
   * Cross-axis offset in pixels from the resolved placement.
   * @default 0
   */
  shift?: number
  /**
   * Whether to flip placement when the preferred side lacks space. `false` disables flipping. An
   * array is an ordered list of fallback `Placement` values tried in order, each `top`,
   * `bottom`, `left`, or `right` optionally followed by `-start` or `-end` (for example
   * `['top', 'bottom-end']`).
   * @default true
   */
  flip?: boolean | Placement[]
  /**
   * Whether the popup may slide along its main axis to remain visible.
   * @default true
   */
  slide?: boolean
  /**
   * Viewport collision padding in pixels.
   * @default 4
   */
  overflowPadding?: number
  /**
   * Whether `Escape` closes the popup. When `false` the popup stays open and `onClosePrevented`
   * is called instead.
   * @default true
   */
  closeOnEscape?: boolean
  /**
   * Whether an outside interaction, pointer press or focus moving elsewhere, closes the popup.
   * When `false` the popup stays open and `onClosePrevented` is called instead. Tabbing out of
   * the control still closes it.
   * @default true
   */
  closeOnOutsideClick?: boolean
  /**
   * Called, without arguments, when `Escape` or an outside interaction was blocked by
   * `closeOnEscape={false}` or `closeOnOutsideClick={false}`. The popup remains open.
   */
  onClosePrevented?: () => void
}
/**
 * Item policies used by navigation, filtering, and selection.
 * @internal
 */
export interface BaseSelectItemBehaviorProps<TItem extends BaseSelectT.Item> {
  /**
   * Plain-text label of an item, used for typeahead, filtering, form values, and plain-text
   * displays such as an input value or tag title; does not change rendered labels.
   * Defaults to the string `label`, otherwise `String(value)`. In `Select` and `Combobox`,
   * string items arrive as `{ value, label }`.
   * @example
   * ```tsx
   * import { Combobox } from 'moraine'
   *
   * <Combobox
   *   items={[
   *     { label: <strong>Apple</strong>, value: 'apple' },
   *     { label: <strong>Pear</strong>, value: 'pear' },
   *   ]}
   *   getItemLabel={(item) => String(item.value)}
   * />
   * ```
   */
  getItemLabel?: (item: TItem) => string

  /**
   * Extra disabled rule, evaluated for every item together with the current selected values;
   * return `true` to disable the item in addition to `item.disabled`. Disabled items cannot be
   * selected, highlighted, or reached by typeahead. In `MultiSelect`, a selected disabled item
   * keeps its tag (it cannot be removed) and survives clearing. In `Select` and `Combobox`,
   * string items arrive as `{ value, label }`.
   * @example
   * ```tsx
   * import { MultiSelect } from 'moraine'
   *
   * <MultiSelect
   *   items={[
   *     { label: 'Admin', value: 'admin' },
   *     { label: 'Guest', value: 'guest' },
   *   ]}
   *   isItemDisabled={(item, values) => item.value === 'guest' && values.includes('admin')}
   * />
   * ```
   */
  isItemDisabled?: (item: TItem, values: readonly TItem['value'][]) => boolean
}

/**
 * Selection behavior forwarded by visual single-value wrappers.
 * @internal
 */
export interface BaseSelectCloseOnSelectOption {
  /**
   * Whether choosing an item closes the popup and returns focus to the control. Defaults to
   * `true` for single selection and `false` when `multiple` is set on `BaseSelect`; `MultiSelect`
   * always keeps the popup open.
   * @default !multiple
   */
  closeOnSelect?: boolean
}

/**
 * Reset notification forwarded by higher-level collection controls.
 * @internal
 */
export interface BaseSelectResetProps {
  /**
   * Called after a native `<form>` reset has restored the initial selection (and, in `Combobox`
   * and `MultiSelect`, cleared the search text). It runs in a microtask after the `reset` event
   * and is skipped when the event was default-prevented. In controlled mode the selection stays
   * at `value`, so use this callback to reset your own state.
   */
  onReset?: () => void

  /**
   * The `id` of a `<form>` the hidden inputs belong to, for a control rendered outside that form.
   */
  form?: string
}

/**
 * Controlled and uncontrolled selection state.
 * @internal
 */
export interface BaseSelectSelection<TValue extends BaseSelectValue> {
  /**
   * Whether selecting an item toggles it among several values instead of replacing the single
   * value. Without it, `value` and `defaultValue` are truncated to their first entry.
   */
  multiple?: boolean

  /**
   * Controlled selection, always an array. `undefined` keeps it uncontrolled; `[]` keeps it
   * controlled and empty. Single mode uses at most the first value.
   */
  value?: readonly TValue[]

  /**
   * Initial selection when `value` is not set. Read once on creation; a native form reset
   * restores it.
   * @default []
   */
  defaultValue?: readonly TValue[]

  /**
   * Called with the new array of selected values when the user changes the selection. Not
   * called for prop updates, when the selection is unchanged, or while disabled or read-only.
   */
  onValueChange?: (value: TValue[]) => void
}

/**
 * Shared props for unmodelled structural parts.
 * @internal
 */
export type BaseSelectPartProps = ElementProps<HTMLDivElement>

export namespace BaseSelectT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = BaseSelectStyleSlot<T>
  export type Variants = BaseSelectStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Value = BaseSelectValue
  export type DisclosureProps = BaseSelectDisclosureProps
  export type PopupProps = BaseSelectPopupProps
  export type ItemBehaviorProps<TItem extends Item> = BaseSelectItemBehaviorProps<TItem>
  export type CloseOnSelectOption = BaseSelectCloseOnSelectOption
  export type ResetProps = BaseSelectResetProps
  export type Selection<TValue extends Value> = BaseSelectSelection<TValue>
  export type PartProps = BaseSelectPartProps

  export interface Item<TValue extends string | number = string | number> {
    /** Unique selection and form value. Values compare by identity, so `1` and `'1'` differ. */
    value: TValue
    /**
     * Visual label. May be any JSX; when it is not a string, plain-text uses (typeahead,
     * filtering) fall back to `String(value)` unless `getItemLabel` is set.
     */
    label: JSX.Element
    /** Whether this item cannot be selected. A disabled item is also left out of form submission. */
    disabled?: boolean
  }

  /** Stable composition surface available to children of BaseSelect. */
  export interface Context<TItem extends Item = Item> {
    items: Accessor<readonly TItem[]>
    value: Accessor<TItem['value'][]>
    open: Accessor<boolean>
    setOpen: (open: boolean) => void
    highlightedValue: Accessor<TItem['value'] | undefined>
    setHighlightedValue: (value: TItem['value'] | undefined) => void
    id: Accessor<string>
    disabled: Accessor<boolean>
    readOnly: Accessor<boolean>
    required: Accessor<boolean>
    invalid: Accessor<boolean>
    locked: Accessor<boolean>
    focusOwner: Accessor<HTMLElement | undefined>
    setFocusOwner: (element: HTMLElement | undefined) => void
    listboxId: Accessor<string>
    itemId: (value: BaseSelectValue) => string
    itemDisabled: (item: TItem) => boolean
    change: (values: readonly TItem['value'][]) => void
    select: (item: TItem) => void
    keyDown: (event: KeyboardEvent, textInput?: boolean) => void
    registerCompositionDiscarder: (discard: () => void) => void
    focus: (event: FocusEvent) => void
    blur: (event: FocusEvent) => void
  }

  export interface TriggerRenderProps<TItem extends Item = Item> {
    /** Whether the popup is open. */
    open: boolean
    /** Current selected value or values. */
    value: readonly TItem['value'][]
    /** Whether the control is disabled. */
    disabled: boolean
    /** Whether selection is read-only. */
    readOnly: boolean
  }

  export interface ItemRenderProps<TItem extends Item = Item> {
    /** Canonical raw item. */
    item: TItem
    /** Whether selected. */
    selected: boolean
    /** Whether highlighted. */
    highlighted: boolean
    /** Whether disabled. */
    disabled: boolean
  }

  export interface Base<TItem extends Item = Item>
    extends
      FieldT.ControlBase,
      BaseSelectDisclosureProps,
      BaseSelectPopupProps,
      BaseSelectItemBehaviorProps<TItem>,
      BaseSelectCloseOnSelectOption,
      BaseSelectResetProps,
      BaseSelectSelection<TItem['value']> {
    /**
     * Flat list of items available for keyboard navigation, typeahead, and selection. It must
     * list the same items you render as `BaseSelect.Item`: an item whose value is not here cannot
     * be selected. Values must be unique (duplicates log an error in development). Groups and
     * separators are rendering concerns and do not belong here.
     */
    items?: readonly TItem[]
    /**
     * Resolves an item from the canonical collection by value.
     *
     * Use this when `items` represents only the current navigation view,
     * such as a filtered collection. When omitted, items are resolved from
     * the current `items` collection. The resolved item decides whether a selected value counts
     * as disabled and is omitted from the form value.
     */
    getItemByValue?: (value: TItem['value']) => TItem | undefined
    /**
     * Whether arrow-key navigation wraps from the ends.
     * @default true
     */
    loop?: boolean
    /**
     * Maps a selected value to the string submitted under `name`; return `undefined` to omit the
     * value from the submission. Defaults to `String(value)`, omitting items with
     * `disabled: true`. With `multiple`, each selected value is submitted as its own entry.
     */
    serializeValue?: (value: TItem['value']) => string | undefined
    /** Composed trigger and popup parts. */
    children?: JSX.Element
  }
  export type Props<TItem extends Item = Item> = BaseProps<
    never,
    Base<TItem>,
    Variants,
    Classes,
    Styles,
    never
  >

  export interface TriggerBase<T extends ValidComponent = 'button', TItem extends Item = Item> {
    /** Element or component to render as. */
    as?: T
    /** Whether this trigger is disabled. */
    disabled?: boolean
    /**
     * Label or reactive presentation function.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component.
     */
    children?: JSX.Element | Component<TriggerRenderProps<TItem>>
  }

  export type TriggerProps<
    T extends ValidComponent = 'button',
    TItem extends Item = Item,
  > = BaseProps<T, TriggerBase<T, TItem>, never, never, never, 'button'>

  export interface ControlBase {}
  export type ControlProps = BaseProps<'div', ControlBase, never, never, never, 'div', true>

  export interface ContentBase {}
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never, 'div', true>

  export interface ListboxBase {}
  export type ListboxProps = BaseProps<'div', ListboxBase, never, never, never, 'div', true>

  export interface GroupBase {}
  export type GroupProps = BaseProps<'div', GroupBase, never, never, never, 'div', true>

  export interface GroupLabelBase {}
  export type GroupLabelProps = BaseProps<'div', GroupLabelBase, never, never, never, 'div', true>

  export interface SeparatorBase {}
  export type SeparatorProps = BaseProps<'div', SeparatorBase, never, never, never, 'div', true>

  export interface EmptyBase {}
  export type EmptyProps = BaseProps<'div', EmptyBase, never, never, never, 'div', true>

  export interface ItemBase<TItem extends Item = Item> {
    /** Raw item belonging to the current navigation collection. */
    item: TItem
    /** Item always renders a div; polymorphism belongs to Trigger. */
    as?: never
    /**
     * Visual content or reactive row presentation.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component.
     */
    children?: JSX.Element | Component<ItemRenderProps<TItem>>
  }
  export type ItemProps<TItem extends Item = Item> = BaseProps<
    'div',
    ItemBase<TItem>,
    never,
    never,
    never
  >
}
export type BaseSelectProps<TItem extends BaseSelectT.Item = BaseSelectT.Item> =
  BaseSelectT.Props<TItem>
