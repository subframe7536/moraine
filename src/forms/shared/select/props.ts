import type { BaseSelectT } from '../../base-select/base-select.types.ts'

type SharedBaseSelectForwardProp = keyof Pick<
  BaseSelectT.Base<BaseSelectT.Item>,
  | 'itemToLabelString'
  | 'id'
  | 'name'
  | 'required'
  | 'disabled'
  | 'readOnly'
  | 'open'
  | 'defaultOpen'
  | 'onOpenChange'
  | 'isItemDisabled'
>

/** BaseSelect ownership shared by the Select-family visual wrappers. */
export const BASE_SELECT_FORWARD_PROP_KEYS = [
  'itemToLabelString',
  'id',
  'name',
  'required',
  'disabled',
  'readOnly',
  'open',
  'defaultOpen',
  'onOpenChange',
  'isItemDisabled',
] as const satisfies readonly SharedBaseSelectForwardProp[]

/** Single-value Select wrappers may additionally configure closing after selection. */
export const SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS = [
  ...BASE_SELECT_FORWARD_PROP_KEYS,
  'closeOnSelect',
] as const satisfies readonly (SharedBaseSelectForwardProp | 'closeOnSelect')[]

/** Local props intercepted by Select. */
export const SELECT_LOCAL_PROP_KEYS = [
  'items',
  'value',
  'defaultValue',
  'onChange',
  'onReset',
  'classes',
  'styles',
  'class',
  'style',
  'size',
  'variant',
  'itemRender',
  'itemProps',
  'listboxProps',
  'virtualRender',
  'scrollToItem',
  'onScrollBottom',
  'scrollBottomThreshold',
  'gutter',
  'overflowPadding',
  'emptyRender',
  'placeholder',
  'allowClear',
  'onClear',
  'loading',
  'leadingIcon',
  'loadingIcon',
  'trailingIcon',
  'closeIcon',
  'ref',
] as const

/** Local props intercepted by Combobox. */
export const COMBOBOX_LOCAL_PROP_KEYS = [
  ...SELECT_LOCAL_PROP_KEYS,
  'searchValue',
  'defaultSearchValue',
  'onSearch',
  'searchMaxLength',
  'filterItem',
  'openOnControlClick',
  'inputRef',
] as const

/** Local props intercepted by MultiSelect. */
export const MULTI_SELECT_LOCAL_PROP_KEYS = [
  ...COMBOBOX_LOCAL_PROP_KEYS,
  'search',
  'tagRender',
  'createItem',
  'maxCount',
  'maxTagCount',
] as const

/** Local props intercepted by TagsInput. */
export const TAGS_INPUT_LOCAL_PROP_KEYS = [
  'id',
  'name',
  'value',
  'defaultValue',
  'onChange',
  'inputValue',
  'defaultInputValue',
  'onInputValueChange',
  'tokenSeparators',
  'maxCount',
  'tagRender',
  'allowClear',
  'onClear',
  'placeholder',
  'disabled',
  'readOnly',
  'required',
  'leadingIcon',
  'closeIcon',
  'classes',
  'styles',
  'size',
  'variant',
  'class',
  'style',
  'ref',
  'inputRef',
  'onInput',
  'onKeyDown',
] as const

/** Popup slots resolved by Select and forwarded to BaseSelect. */
export const BASE_SELECT_SHARED_SLOTS = [
  'content',
  'listbox',
  'item',
  'group',
  'groupLabel',
  'separator',
  'empty',
] as const satisfies readonly (keyof Pick<
  BaseSelectT.Slot,
  'content' | 'listbox' | 'item' | 'group' | 'groupLabel' | 'separator' | 'empty'
>)[]
