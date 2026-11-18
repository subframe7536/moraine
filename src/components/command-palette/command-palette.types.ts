import type { Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps, ElementProps, InputElementProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'
import type { ListT } from '../list'

import type { defaultCommandPaletteMessages } from './command-palette.messages'
import type {
  CommandPaletteStyleSlot,
  CommandPaletteStyleVariants,
} from './command-palette.style-types'

interface CommandPaletteBaseRenderProps<TItem extends CommandPaletteT.Item = CommandPaletteT.Item> {
  searchValue: string
  loading: boolean
  hasItems: boolean
  groups: CommandPaletteT.Group<TItem>[]
  visibleGroups: CommandPaletteT.Group<TItem>[]
}

export namespace CommandPaletteT {
  export type Kind = 'single'
  export type Slot<T = unknown> = CommandPaletteStyleSlot<T>

  export type Variants = CommandPaletteStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultCommandPaletteMessages>
  export type Translations = Partial<Messages>

  export interface Item {
    /**
     * Identifier of the item, unique across all groups. It is also the displayed label when
     * `label` is empty and part of the default search text. Duplicates still render but log a
     * warning in development.
     */
    value: string
    /** Primary label shown for the item. Falls back to `value`. */
    label?: string
    /**
     * Secondary text shown for the item, below or after the label depending on the
     * `descriptionPosition` variant. Part of the default search text.
     */
    description?: string
    /**
     * Extra search terms that are not displayed, such as synonyms. They are matched by the
     * built-in filter only; ignored when `getItemSearchText` is set or `filterMethod` is a function.
     */
    keywords?: string[]
    /**
     * Content or render function shown before the label, such as an icon. Receives the row state.
     * Ignored when the palette sets `itemRender`.
     */
    leadingRender?: JSX.Element | Component<ItemRenderProps>
    /**
     * Content or render function shown at the end of the row, such as a shortcut hint. Receives
     * the row state. Ignored when the palette sets `itemRender`.
     */
    trailingRender?: JSX.Element | Component<ItemRenderProps>
    /**
     * Whether the item is disabled: it cannot be selected and keyboard navigation skips it. It is
     * still displayed and marked `aria-disabled`.
     */
    disabled?: boolean
    /**
     * Keeps the item visible while the search text filters the list, even when it does not
     * match, for entries like "Search the docs for...".
     */
    alwaysShow?: boolean
    /**
     * Called, without arguments, when the item is selected by click or Enter. It runs before the
     * palette's `onSelect` and `onCloseRequest`. Not called for disabled items.
     */
    onSelect?: () => void
  }

  export interface Group<TItem extends Item = Item> {
    /** Marks the entry as a group of items. */
    type: 'group'
    /**
     * Header shown above the group's items. Without it the items render with no header.
     */
    label?: string
    /** Items in this group. While searching, a group with no matching items is hidden. */
    items?: TItem[]
  }

  /** An entry of `items`: a command, or a group of commands. */
  export type Entry<TItem extends Item = Item> = TItem | Group<TItem>

  export interface VirtualLabelEntry<TItem extends Item = Item> {
    /** Structural entry rendered before a command group. */
    type: 'label'
    /** Stable key used by a virtualizer. */
    key: string
    /** Visible group label. */
    label: string
    /** Source group containing the command. */
    group: Group<TItem>
  }

  export interface VirtualItemEntry<TItem extends Item = Item> {
    /** Selectable command entry. */
    type: 'item'
    /** Stable normalized command key. */
    key: string
    /** Source command. */
    item: TItem
    /** Source group containing the command. */
    group: Group<TItem>
    /** Whether the command cannot be selected. */
    disabled: boolean
  }

  export type VirtualEntry<TItem extends Item = Item> =
    | VirtualLabelEntry<TItem>
    | VirtualItemEntry<TItem>

  /** Virtualizer over `VirtualEntry` rows, such as `createListVirtualizer()`. */
  export type Virtualizer<TItem extends Item = Item> = ListT.Virtualizer<VirtualEntry<TItem>>

  export interface ItemRenderProps<
    TItem extends Item = Item,
  > extends CommandPaletteBaseRenderProps<TItem> {
    item: TItem
    group: Group<TItem>
    /** Whether the item is currently highlighted. */
    highlighted: boolean
    disabled: boolean
  }

  export type EmptyRenderProps<TItem extends Item = Item> = CommandPaletteBaseRenderProps<TItem>
  export type FooterRenderProps<TItem extends Item = Item> = CommandPaletteBaseRenderProps<TItem>

  export interface Base<TItem extends Item = Item> {
    /**
     * Overrides for this instance's built-in texts (`placeholder`, `close`, `empty`), merged over
     * the messages from `MoraineProvider`. The `placeholder` prop takes precedence over the
     * `placeholder` translation.
     * @example
     * ```tsx
     * import { CommandPalette } from 'moraine'
     *
     * <CommandPalette
     *   closable
     *   items={[]}
     *   translations={{ placeholder: 'Type a command...', empty: 'Nothing found.', close: 'Dismiss' }}
     * />
     * ```
     */
    translations?: Translations
    /** Ref forwarded to the root `<div>` element. */
    ref?: Ref<HTMLDivElement>
    /** Ref forwarded to the inner search `<input>` element. */
    inputRef?: Ref<HTMLInputElement>
    /**
     * Commands to display, in order: command objects and `{ type: 'group', label, items }` groups.
     * Consecutive commands outside a group render together without a header. The search text
     * filters them according to `filterMethod`; the list is reactive to changes of this prop.
     * @default []
     * @example
     * ```tsx
     * import { CommandPalette } from 'moraine'
     *
     * <CommandPalette
     *   items={[
     *     { value: 'home', label: 'Home' },
     *     {
     *       type: 'group',
     *       label: 'File',
     *       items: [
     *         { value: 'new', label: 'New file', keywords: ['create'], onSelect: () => {} },
     *         { value: 'save', label: 'Save', description: 'Write to disk', disabled: true },
     *       ],
     *     },
     *   ]}
     * />
     * ```
     */
    items?: Entry<TItem>[]
    /**
     * Placeholder text for the search input. It is also the input's accessible name unless
     * `inputProps` sets `aria-label` or `aria-labelledby`.
     * Localized via MoraineProvider messages. English default is `Search...`.
     */
    placeholder?: string
    /**
     * Search text (controlled). Leave it `undefined` for uncontrolled state and update it from
     * `onSearchValueChange`. Surrounding whitespace is ignored when filtering.
     */
    searchValue?: string
    /**
     * Initial search text when uncontrolled.
     * @default ''
     */
    defaultSearchValue?: string
    /**
     * Called with the new search text when the user edits the input. While an IME composition
     * is in progress it is deferred until the composition ends (except on Android). It is not called when
     * `searchValue` changes from outside.
     */
    onSearchValueChange?: (value: string) => void
    /**
     * Called with the selected item when the user clicks an enabled item or presses Enter on the
     * highlighted one. It runs after the item's own `onSelect`, and before `onCloseRequest` when
     * `closeOnSelect` is `true`.
     */
    onSelect?: (item: TItem) => void
    /** Maximum number of characters the search input accepts (the native `maxlength`). */
    searchMaxLength?: number
    /**
     * Whether to focus the search input when the palette mounts. Skipped when the palette is
     * inside an element with `role="dialog"`, which handles its own initial focus.
     * @default true
     */
    autofocus?: boolean
    /**
     * Icon name of input's leading icon. Replaced by `loadingIcon` while `loading` is `true`.
     * @default 'icon-search'
     */
    leading?: IconT.Name
    /**
     * Icon shown in place of `leading` while `loading` is `true`; the icon is marked
     * `aria-busy`.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /**
     * Icon name for the palette close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name
    /**
     * Whether to show a close button in the header. Clicking it calls `onCloseRequest`.
     * @default false
     */
    closable?: boolean
    /**
     * Called when the palette asks to be closed: when the close button is clicked, and after an
     * enabled item is selected when `closeOnSelect` is `true`. It is a request only; the palette
     * never hides itself, so use it to close the surrounding `Dialog`, `BaseDialog`, or your own
     * container. Escape is not handled here.
     */
    onCloseRequest?: () => void
    /**
     * Whether selecting an enabled item calls `onCloseRequest` after `onSelect`. The palette does not
     * close itself.
     * @default true
     */
    closeOnSelect?: boolean
    /**
     * Whether the palette is loading, for example while `items` are fetched. Swaps the leading
     * icon for `loadingIcon`; items stay visible and selectable.
     * @default false
     */
    loading?: boolean
    /**
     * Text that the built-in filter (`filterMethod` strings) matches for an item; it does not
     * change rendered labels. Replaces the default search text, which is the label, value,
     * description, and keywords joined by spaces.
     * @example
     * ```tsx
     * import { CommandPalette } from 'moraine'
     *
     * <CommandPalette
     *   items={[{ value: 'open', label: 'Open', keywords: ['launch'] }]}
     *   getItemSearchText={(item) => `${item.label ?? ''} ${item.keywords?.join(' ') ?? ''}`}
     * />
     * ```
     */
    getItemSearchText?: (item: TItem) => string
    /**
     * Filtering strategy applied to the trimmed search text. The built-in strategies match the
     * item's search text (see `getItemSearchText`) ignoring case and accents, using the active
     * locale. A predicate receives the trimmed query and the item, and returns whether to
     * keep it; it is not called for an empty query. `false` disables filtering, for example
     * when you filter `items` yourself. Items with `alwaysShow` stay visible.
     * @default 'contains'
     * @example
     * ```tsx
     * import { CommandPalette } from 'moraine'
     *
     * <CommandPalette
     *   items={[{ value: 'open-file', label: 'Open file' }]}
     *   filterMethod={(query, item) =>
     *     item.value.split('-').some((part) => part.startsWith(query.toLowerCase()))
     *   }
     * />
     * ```
     */
    filterMethod?:
      | false
      | 'contains'
      | 'startsWith'
      | 'endsWith'
      | ((query: string, item: TItem) => boolean)
    /**
     * Content or render function shown instead of the listbox rows when no item is visible
     * (no groups, or none matches the search). The default is the localized `empty` message.
     * A function receives the search text and loading state.
     * @example
     * ```tsx
     * import { CommandPalette } from 'moraine'
     *
     * <CommandPalette
     *   items={[]}
     *   emptyRender={(state) => <p>No command matches "{state.searchValue}".</p>}
     * />
     * ```
     */
    emptyRender?: JSX.Element | Component<EmptyRenderProps<TItem>>
    /**
     * Content or render function for a footer below the list, such as keyboard hints. Nothing is
     * rendered when unset. A function receives the search text, loading state, and the groups.
     * @example
     * ```tsx
     * import { CommandPalette } from 'moraine'
     *
     * <CommandPalette
     *   items={[]}
     *   footerRender={(state) => <span>{state.visibleGroups.length} groups shown</span>}
     * />
     * ```
     */
    footerRender?: JSX.Element | Component<FooterRenderProps<TItem>>
    /**
     * Renders the content of every command row instead of the default leading, label,
     * description, and trailing layout (the items' `leadingRender` and `trailingRender` are then
     * ignored). The row element itself, with its `option` role, highlight, and click handling,
     * stays. Receives the item, its group, and `highlighted`/`disabled` state.
     * @example
     * ```tsx
     * import { CommandPalette } from 'moraine'
     *
     * <CommandPalette
     *   items={[{ value: 'open', label: 'Open' }]}
     *   itemRender={(row) => (
     *     <strong>{row.highlighted ? '> ' : ''}{row.item.label ?? row.item.value}</strong>
     *   )}
     * />
     * ```
     */
    itemRender?: Component<ItemRenderProps<TItem>>
    /**
     * Renders only the visible rows of the flattened group labels and commands. The listbox is
     * the scroll container, and keyboard highlight scrolls through the virtualizer.
     */
    virtualizer?: Virtualizer<TItem>
    /**
     * Additional attributes for the command listbox element. Its `id` and `role` are managed by
     * the palette; `class` and `style` are merged with the slot styling.
     */
    listboxProps?: Omit<ElementProps<HTMLDivElement>, 'children'>
    /**
     * Function returning additional attributes for a command row (the `option` element). It is
     * called per row with the row state. Event handlers run before the built-in ones, and
     * calling `event.preventDefault()` in them skips the built-in behavior. `id`, `role`, and
     * `aria-selected` are managed by the palette.
     * @example
     * ```tsx
     * import { CommandPalette } from 'moraine'
     *
     * <CommandPalette
     *   items={[{ value: 'open', description: 'Open a file' }]}
     *   itemProps={(row) => ({ title: row.item.description })}
     * />
     * ```
     */
    itemProps?: (context: ItemRenderProps<TItem>) => ElementProps<HTMLDivElement> | undefined
    /**
     * Additional attributes for the search `<input>`. Its `onInput` and `onKeyDown` handlers run
     * before the built-in ones, and calling `event.preventDefault()` in them skips the built-in
     * behavior. `value`, `role`, and the combobox `aria-*` wiring are managed by the palette;
     * `aria-label` or `aria-labelledby` replace the placeholder as the accessible name.
     */
    inputProps?: InputElementProps
  }

  export type Props<TItem extends Item = Item> = BaseProps<
    'div',
    Base<TItem>,
    Variants,
    Classes,
    Styles
  >
}

export type CommandPaletteProps<TItem extends CommandPaletteT.Item = CommandPaletteT.Item> =
  CommandPaletteT.Props<TItem>
