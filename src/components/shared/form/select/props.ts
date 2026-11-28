import type { SlotBinding } from '../../../../theme/use-recipe'
import type { BaseSelectT } from '../../../base-select/base-select.types'
type SharedBaseSelectForwardProp = keyof Pick<
  BaseSelectT.Base,
  | 'getItemLabel'
  | 'id'
  | 'name'
  | 'form'
  | 'required'
  | 'disabled'
  | 'readOnly'
  | 'open'
  | 'defaultOpen'
  | 'onOpenChange'
  | 'onExitComplete'
  | 'preventScroll'
  | 'isItemDisabled'
  | 'placement'
  | 'align'
  | 'gutter'
  | 'shift'
  | 'flip'
  | 'slide'
  | 'overflowPadding'
  | 'closeOnEscape'
  | 'closeOnOutsideClick'
  | 'onClosePrevented'
>

/** BaseSelect ownership shared by the Select-family visual wrappers. */
export const BASE_SELECT_FORWARD_PROP_KEYS = [
  'getItemLabel',
  'id',
  'name',
  'form',
  'required',
  'disabled',
  'readOnly',
  'open',
  'defaultOpen',
  'onOpenChange',
  'onExitComplete',
  'preventScroll',
  'isItemDisabled',
  'placement',
  'align',
  'gutter',
  'shift',
  'flip',
  'slide',
  'overflowPadding',
  'closeOnEscape',
  'closeOnOutsideClick',
  'onClosePrevented',
] as const satisfies ReadonlyArray<SharedBaseSelectForwardProp>

/** Single-value Select wrappers may additionally configure closing after selection. */
export const SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS = [
  ...BASE_SELECT_FORWARD_PROP_KEYS,
  'closeOnSelect',
] as const satisfies ReadonlyArray<SharedBaseSelectForwardProp | 'closeOnSelect'>

/** Local props intercepted by Select. */
export const SELECT_LOCAL_PROP_KEYS = [
  'items',
  'value',
  'defaultValue',
  'onValueChange',
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
  'onBottomReached',
  'scrollThreshold',
  'emptyRender',
  'placeholder',
  'clearable',
  'onClear',
  'loading',
  'leading',
  'loadingIcon',
  'trailing',
  'clearIcon',
  'ref',
  'translations',
] as const

/** Local props intercepted by Select only. */
export const SINGLE_SELECT_LOCAL_PROP_KEYS = [...SELECT_LOCAL_PROP_KEYS, 'triggerRef'] as const

/** Local props intercepted by Combobox. */
export const COMBOBOX_LOCAL_PROP_KEYS = [
  ...SELECT_LOCAL_PROP_KEYS,
  'virtualizer',
  'searchValue',
  'defaultSearchValue',
  'onSearchValueChange',
  'searchMaxLength',
  'autoComplete',
  'filterMethod',
  'openOnControlClick',
  'inputRef',
] as const

/** Local props intercepted by MultiSelect. */
export const MULTI_SELECT_LOCAL_PROP_KEYS = [
  ...COMBOBOX_LOCAL_PROP_KEYS,
  'searchable',
  'tagRender',
  'tagOverflowRender',
  'createItem',
  'maxValues',
  'maxVisible',
  'removeIcon',
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
] as const satisfies ReadonlyArray<
  keyof Pick<
    BaseSelectT.Slot,
    'content' | 'listbox' | 'item' | 'group' | 'groupLabel' | 'separator' | 'empty'
  >
>

/** Maps resolved Select-family popup slots to lazy reactive BaseSelect style props. */
export function createBaseSelectStyleProps(
  slots: Partial<Record<(typeof BASE_SELECT_SHARED_SLOTS)[number], SlotBinding>>,
) {
  const classesObj: BaseSelectT.Classes = {}
  const stylesObj: BaseSelectT.Styles = {}
  for (const name of BASE_SELECT_SHARED_SLOTS) {
    const slot = slots[name]
    if (slot) {
      Object.defineProperty(classesObj, name, {
        enumerable: true,
        get: () => slot.class,
      })
      Object.defineProperty(stylesObj, name, {
        enumerable: true,
        get: () => slot.style,
      })
    }
  }
  return {
    classes: () => classesObj,
    styles: () => stylesObj,
  }
}
