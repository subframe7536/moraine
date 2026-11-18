import type { Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type {
  BaseSelectDisclosureProps,
  BaseSelectItemBehaviorProps,
  BaseSelectResetProps,
  BaseSelectT,
} from '../base-select/base-select.types'
import type { FieldT } from '../field'
import type { IconT } from '../icon/index'
import type { defaultTagsFieldMessages } from '../shared/form/select/tags-field.messages'
import type {
  SearchProps,
  ContentProps,
  SelectRow,
  SelectGroup,
  SelectEntry,
  SelectVirtualizer,
} from '../shared/form/select/types'

import type { defaultMultiSelectMessages } from './multi-select.messages'
import type { MultiSelectStyleSlot, MultiSelectStyleVariants } from './multi-select.style-types'

export namespace MultiSelectT {
  export type Kind = 'single'
  export type Slot<T = unknown> = MultiSelectStyleSlot<T>
  export type Variants = MultiSelectStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultMultiSelectMessages> &
    ComponentMessages<typeof defaultTagsFieldMessages>
  export type Translations = Partial<Messages>

  export interface Item<
    Val extends string | number = string | number,
  > extends BaseSelectT.Item<Val> {
    /** Icon rendered before the label in the default item content. Ignored when `itemRender` is set. */
    icon?: IconT.Name
    /** Secondary text rendered under the label in the default item content. Ignored when `itemRender` is set. */
    description?: JSX.Element
  }
  export type Group<TItem extends Item = Item> = SelectGroup<TItem>
  export type Entry<TItem extends Item = Item> = SelectEntry<TItem>
  export type Row<TItem extends Item = Item> = SelectRow<TItem>
  /** Virtualizer over `Row` entries, such as `createListVirtualizer<MultiSelectT.Row>()`. */
  export type Virtualizer<TItem extends Item = Item> = SelectVirtualizer<TItem>
  export type ItemRenderProps<TItem extends Item = Item> = BaseSelectT.ItemRenderProps<TItem>

  export interface TagRenderProps<TItem extends Item = Item> {
    /** Selected item represented by the tag. */
    item: TItem | undefined
    /** Original selected value, including unresolved values. */
    value: TItem['value']
    /** Visual label, or String(value) when unresolved. */
    label: import('solid-js').JSX.Element
    /** Removes this item from the selection. */
    remove: () => void
  }

  export type TagOverflowEntry<TItem extends Item = Item> = Pick<
    TagRenderProps<TItem>,
    'item' | 'value' | 'label'
  >

  export interface TagOverflowRenderProps<TItem extends Item = Item> {
    /** Number of selected tags hidden by `maxVisible`. */
    count: number
    /** Hidden tags in selection order. */
    tags: readonly TagOverflowEntry<TItem>[]
  }

  export interface EmptyRenderProps<TItem extends Item = Item> {
    /** Current search text. */
    searchValue: string
    /** Whether the current filter has any matches. */
    hasMatches: boolean
    /** Currently selected values. */
    selectedValues: readonly TItem['value'][]
    /** Whether the maximum selection count has been reached. */
    isAtMaxCount: boolean
    /** Create a new tag (requires `createItem`). Returns true if successfully created. */
    create: (value?: string) => boolean
    /** Close the dropdown menu. */
    close: () => void
  }

  export interface Base<TItem extends Item = Item>
    extends
      FieldT.ControlBase,
      BaseSelectDisclosureProps,
      BaseSelectItemBehaviorProps<TItem>,
      BaseSelectResetProps,
      SearchProps<TItem>,
      ContentProps<TItem> {
    /**
     * Controlled array of selected item values, in selection order. `undefined` keeps the
     * selection uncontrolled; `[]` keeps it controlled and empty. In controlled mode the
     * selection changes only when you update this prop in `onValueChange`.
     */
    value?: TItem['value'][]
    /**
     * Initial selected values when `value` is not set. Read once on creation; a native form reset
     * restores it.
     */
    defaultValue?: TItem['value'][]
    /**
     * Overrides the built-in messages for this instance, merged over the messages from the
     * provider and locale: `clear`, `loading`, `toggle`, `empty`, `placeholder`, `overflow`,
     * `create`, and `remove`. `overflow({ count })`, `create({ value })`, and `remove({ title })`
     * are functions returning the text.
     * @example
     * ```tsx
     * import { MultiSelect } from 'moraine'
     *
     * <MultiSelect
     *   items={[{ label: 'Design', value: 'design' }]}
     *   createItem={(input) => ({ label: input, value: input })}
     *   translations={{
     *     create: ({ value }) => `Add "${value}"`,
     *     remove: ({ title }) => `Remove tag ${title}`,
     *     overflow: ({ count }) => `${count} more selected`,
     *   }}
     * />
     * ```
     */
    translations?: Translations
    /**
     * Options of the popup list: item objects (no string shorthand), optionally grouped with
     * `{ type: 'group', label, items }` and divided with `{ type: 'separator' }`. Item values must
     * be unique across the whole collection; a repeated value is ignored and logs an error in
     * development. Items created through `createItem` are added on top of this list.
     * @example
     * ```tsx
     * import { MultiSelect } from 'moraine'
     *
     * <MultiSelect
     *   items={[
     *     { label: 'Design', value: 'design' },
     *     { type: 'separator' },
     *     {
     *       type: 'group',
     *       label: 'Engineering',
     *       items: [
     *         { label: 'Frontend', value: 'frontend' },
     *         { label: 'Backend', value: 'backend', disabled: true },
     *       ],
     *     },
     *   ]}
     * />
     * ```
     */
    items?: Entry<TItem>[]
    /**
     * Called with the full new array of selected values when the user adds or removes an item
     * (clicking an option, `Enter`, removing a tag, or clearing). The search text is cleared
     * afterwards. Not called for prop updates or while disabled or read-only.
     */
    onValueChange?: (value: NoInfer<TItem['value'][]>) => void
    /**
     * Shows a clear button while there are selected values or search text. Clearing removes every
     * selected value except those of disabled items, empties the search text, calls `onClear`,
     * and returns focus to the control.
     * @default false
     */
    clearable?: boolean
    /** Called once after a clear action (see `clearable`), following `onValueChange`. */
    onClear?: () => void
    /**
     * Creates an item from free text. It is called with the trimmed text when the user commits
     * text that matches no existing item by label or value (ignoring case and accents), by
     * pressing `Enter`, completing a token separator, pasting, or calling `create` from
     * `emptyRender`. The returned item (its `value` must be a string or number) is selected and
     * added to the top of the option list until the form is reset. Nothing is created once
     * `maxCount` is reached or when the value is already selected. Providing it also enables the
     * editable search input, like `search`.
     * @example
     * ```tsx
     * import { MultiSelect } from 'moraine'
     *
     * <MultiSelect
     *   items={[{ label: 'Design', value: 'design' }]}
     *   createItem={(input) => ({ label: input, value: input.toLowerCase() })}
     * />
     * ```
     */
    createItem?: (input: string) => TItem
    /**
     * Maximum number of selected values. Once reached, unselected options are disabled and typed
     * text is not committed; selected ones can still be removed. It does not truncate a larger
     * `value`.
     */
    maxCount?: number
    /**
     * Maximum number of tags rendered in the control. The remaining selected values collapse into
     * a `+N` summary, or into `tagOverflowRender`. The selection itself is unaffected. `0` hides
     * every tag; unlimited when omitted.
     */
    maxVisible?: number
    /**
     * Strings that commit completed input tokens through `createItem` or an exact source match,
     * while typing or pasting into the editable input. Duplicate separators are ignored and
     * overlapping separators prefer the longest match.
     * @default [',']
     */
    tokenSeparators?: string[]
    /**
     * Replaces the default tag (label plus remove button) of each visible tag. Receives
     * `{ item, value, label, remove }`; `item` is `undefined` for a selected value that matches
     * no item. Provide your own control that calls `remove()`, which does nothing for disabled
     * items.
     * @example
     * ```tsx
     * import { MultiSelect } from 'moraine'
     *
     * <MultiSelect
     *   items={[{ label: 'Design', value: 'design' }]}
     *   defaultValue={['design']}
     *   tagRender={(tag) => (
     *     <button type="button" onClick={() => tag.remove()}>
     *       {tag.label} ×
     *     </button>
     *   )}
     * />
     * ```
     */
    tagRender?: Component<TagRenderProps<TItem>>
    /**
     * Content shown in place of the default `+N` summary when `maxVisible` hides tags. A
     * function receives `{ count, tags }`, where `tags` are the hidden entries in selection order.
     * @example
     * ```tsx
     * import { MultiSelect } from 'moraine'
     *
     * <MultiSelect
     *   items={[
     *     { label: 'Design', value: 'design' },
     *     { label: 'Code', value: 'code' },
     *   ]}
     *   defaultValue={['design', 'code']}
     *   maxVisible={1}
     *   tagOverflowRender={(overflow) => <span>and {overflow.count} more</span>}
     * />
     * ```
     */
    tagOverflowRender?: JSX.Element | Component<TagOverflowRenderProps<TItem>>
    /**
     * Content shown in the popup when no item matches the search text or `items` is empty. A
     * function receives `{ searchValue, hasMatches, selectedValues, isAtMaxCount, create, close }`,
     * where `create(value?)` runs `createItem` for `value` (default: the current search text) and
     * returns whether an item was added. Defaults to the `create` translation (`Press Enter to
     * create “text”`) when `createItem` is set and text was typed, otherwise to the `empty`
     * translation.
     * @example
     * ```tsx
     * import { MultiSelect } from 'moraine'
     *
     * <MultiSelect
     *   items={[{ label: 'Design', value: 'design' }]}
     *   createItem={(input) => ({ label: input, value: input })}
     *   emptyRender={(state) => (
     *     <button type="button" onClick={() => state.create()}>
     *       Add "{state.searchValue}"
     *     </button>
     *   )}
     * />
     * ```
     */
    emptyRender?: JSX.Element | Component<EmptyRenderProps<TItem>>
    /**
     * Text shown in the control while no value is selected: a label in the non-editable control,
     * or the input placeholder when editable. Hidden as soon as there is a tag.
     * @default ''
     */
    placeholder?: string
    /**
     * Replaces the toggle icon with `loadingIcon`, and disables the toggle button and marks it
     * `aria-busy`. Typing and the clear button keep working in the editable input.
     */
    loading?: boolean
    /**
     * Icon shown instead of `trailing` while `loading`.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /** Icon rendered before the tags and input. */
    leading?: IconT.Name
    /**
     * Icon of the toggle button that opens and closes the popup; replaced by `loadingIcon` while
     * `loading`.
     * @default 'icon-chevron-down'
     */
    trailing?: IconT.Name
    /**
     * Icon of the clear button.
     * @default 'icon-close'
     */
    clearIcon?: IconT.Name
    /**
     * Icon used by tag remove buttons.
     * @default 'icon-close'
     */
    removeIcon?: IconT.Name
    /**
     * Whether a pointer click on the control (outside its buttons) opens the popup. Defaults
     * to `false` when editable (`search` or `createItem` set) and `true` otherwise. Typing
     * non-blank text, `ArrowDown`, and the toggle button open it regardless.
     */
    openOnControlClick?: boolean
    /**
     * Adds an editable input to the control so typing filters the options, using `filterMethod`.
     * It is also enabled implicitly by `createItem`. When neither is set the control is a
     * non-editable trigger: there is no input, and `filterMethod` and `autocomplete` have no
     * effect.
     * @default false
     */
    search?: boolean
    /** Optional editable inner input element ref. Not assigned in non-editable mode. */
    inputRef?: Ref<HTMLInputElement>
  }

  export type Props<TItem extends Item = Item> = BaseProps<
    'div',
    Base<TItem>,
    Variants,
    Classes,
    Styles
  >
}

export type MultiSelectProps<TItem extends MultiSelectT.Item = MultiSelectT.Item> =
  MultiSelectT.Props<TItem>
