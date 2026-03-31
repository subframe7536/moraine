import type { JSX } from 'solid-js'

import { FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS } from '../../form-field/form-options'

export interface BaseSelectItems<TItems> {
  value?: string | number
  label?: string | JSX.Element
  key?: string
  disabled?: boolean
  children?: TItems[]
}

export type SelectFilterMode = 'startsWith' | 'endsWith' | 'contains'

export type SelectFilterOption<TRaw> =
  | boolean
  | SelectFilterMode
  | ((inputValue: string, option: TRaw) => boolean)

export interface SelectFilterableOption<TRaw> {
  key: string
  raw: TRaw
}

export interface NormalizedOption<TItems> {
  value: string
  label: string | JSX.Element
  key: string
  disabled: boolean
  raw: TItems
  isGroup?: false
}

export interface NormalizedGroup<TItems> {
  label: string | JSX.Element
  options: NormalizedOption<TItems>[]
  isGroup: true
}

export interface SelectControlState<TItems> {
  selectedOptions: () => NormalizedOption<TItems>[]
  remove: (option: NormalizedOption<TItems>) => void
  clear: () => void
}

export const SELECT_SPLIT_KEYS = [
  ...FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS,
  'onChange',
  'search',
  'searchValue',
  'defaultSearchValue',
  'onSearch',
  'searchMaxLength',
  'filterOption',
  'openOnClick',
  'allowClear',
  'onClear',
  'virtualized',
  'onScrollBottom',
  'scrollBottomThreshold',
  'options',
  'optionRender',
  'labelRender',
  'emptyRender',
  'placeholder',
  'loading',
  'loadingIcon',
  'leadingIcon',
  'triggerIcon',
  'closeIcon',
  'size',
  'variant',
  'classes',
] as const

export const MULTI_SELECT_SPLIT_KEYS = [
  ...SELECT_SPLIT_KEYS,
  'tokenSeparators',
  'allowCreate',
  'maxCount',
  'maxTagCount',
  'tagRender',
  'tagVariant',
] as const

export const SELECT_COMMON_DEFAULT_PROPS = {
  variant: 'outline' as const,
  placeholder: '',
  allowClear: false,
  triggerIcon: 'icon-chevron-down' as const,
  loadingIcon: 'icon-loading' as const,
  filterOption: true,
  openOnClick: 'control' as const,
}

export const SELECT_COMMON_COMBOBOX_PROPS = {
  optionValue: 'value' as const,
  optionLabel: 'label' as const,
  optionDisabled: 'disabled' as const,
  optionTextValue: 'key' as const,
  triggerMode: 'manual' as const,
  allowsEmptyCollection: true,
  shouldFocusWrap: true,
  overflowPadding: -2,
}
