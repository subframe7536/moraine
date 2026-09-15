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
  'closeOnSelect',
  'isItemDisabled',
] as const

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
  'search',
  'searchValue',
  'defaultSearchValue',
  'onSearch',
  'searchMaxLength',
  'filterItem',
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
  'inputRef',
] as const

/** Local props intercepted by MultiSelect. */
export const MULTI_SELECT_LOCAL_PROP_KEYS = [
  ...SELECT_LOCAL_PROP_KEYS,
  'closeOnSelect',
  'tagRender',
  'createItem',
  'maxCount',
  'maxTagCount',
  'tokenSeparators',
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
] as const
