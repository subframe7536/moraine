import type { Component, JSX } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type {
  BaseSelectCloseOnSelectOption,
  BaseSelectDisclosureProps,
  BaseSelectFieldProps,
  BaseSelectItemBehaviorProps,
  BaseSelectResetProps,
  BaseSelectT,
} from '../base-select/base-select.types'
import type { IconT } from '../icon/index'
import type { FormValueOptions } from '../shared/form/form-options.types'
import type {
  NormalizedSelectItem,
  ContentProps,
  SelectGroup,
  SelectEntry,
} from '../shared/form/select/types'

import type { defaultSelectMessages } from './select.messages'
import type { SelectStyleSlot, SelectStyleVariants } from './select.style-types'

export namespace SelectT {
  export type Kind = 'single'
  export type Slot<T = unknown> = SelectStyleSlot<T>
  export type Variants = SelectStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultSelectMessages>
  export type Translations = Partial<Messages>

  export interface Item<
    Val extends string | number = string | number,
  > extends BaseSelectT.Item<Val> {
    /** Leading item icon. */
    icon?: IconT.Name
    /** Secondary item description. */
    description?: JSX.Element
  }
  export type NormalizedItem<T extends string | Item> = NormalizedSelectItem<T>
  export type Group<TItem extends string | Item = string | Item> = SelectGroup<TItem>
  export type Entry<TItem extends string | Item = string | Item> = SelectEntry<TItem>
  export type ItemRenderProps<TItem extends string | Item = string | Item> =
    BaseSelectT.ItemRenderProps<NormalizedItem<TItem>>
  export interface EmptyRenderProps<TItem extends string | Item = string | Item> {
    /** Currently selected value. */
    selectedValue: NormalizedItem<TItem>['value'] | undefined
    /** Close the select popup. */
    close: () => void
  }

  export interface Base<TItem extends string | Item = string | Item>
    extends
      BaseSelectFieldProps,
      BaseSelectDisclosureProps,
      BaseSelectItemBehaviorProps<NormalizedItem<TItem>>,
      BaseSelectCloseOnSelectOption,
      BaseSelectResetProps,
      Omit<ContentProps<NormalizedItem<TItem>>, 'virtualRender' | 'scrollToItem'>,
      FormValueOptions<NormalizedItem<TItem>['value']> {
    /** Localized message overrides for this select instance. */
    translations?: Translations
    /** String shorthand or object items, optionally grouped or separated. Item values must be unique within the collection. */
    items?: Entry<TItem>[]
    /** Called when the selection changes. */
    onValueChange?: (value: NoInfer<NormalizedItem<TItem>['value']> | undefined) => void
    /** Content or render function for the empty state. */
    emptyRender?: JSX.Element | Component<EmptyRenderProps<TItem>>
    /**
     * Placeholder text shown when no value is selected.
     * @default ''
     */
    placeholder?: string
    /** Whether the select is in a loading state. */
    loading?: boolean
    /** Show a pointer clear affordance when a value is selected. */
    allowClear?: boolean
    /** Called when clear is triggered. */
    onClear?: () => void
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
    /** Icon used by the clear affordance. */
    closeIcon?: IconT.Name
  }

  export type Props<TItem extends string | Item = string | Item> = BaseProps<
    'div',
    Base<TItem>,
    Variants,
    Classes,
    Styles
  >
}

export type SelectProps<TItem extends string | SelectT.Item = string | SelectT.Item> =
  SelectT.Props<TItem>
