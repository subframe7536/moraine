import { createDataAttributes } from '../../shared/style-contract.ts'
import type { StyleContractState } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe.ts'
import { baseSelectDataAttributes } from '../base-select/base-select.recipe.ts'
import {
  SECONDARY_TRIGGER_CLASS,
  SELECT_FAMILY_SLOTS,
  SELECT_TRIGGER_FIELD_VARIANTS,
  TAG_FIELD_CONTROL_CLASS,
  TAG_FIELD_INPUT_CLASS,
  TAG_SIZES,
  TAG_SLOTS,
} from '../shared/select/select-field.recipe.ts'

import type { MultiSelectStyleSlot, MultiSelectStyleVariant } from './multi-select.style-types'

export const multiSelectDataAttributes = {
  control: (state: StyleContractState) =>
    createDataAttributes({
      'data-closed': state.closed,
      'data-disabled': state.disabled,
      'data-editable': state.editable,
      'data-expanded': state.expanded,
      'data-invalid': state.invalid,
      'data-readonly': state.readonly,
      'data-required': state.required,
      'data-tags': state.tags,
    }),
  content: baseSelectDataAttributes.content,
  item: baseSelectDataAttributes.item,
  input: (state: StyleContractState) => createDataAttributes({ 'data-duplicate': state.duplicate }),
  trigger: (state: StyleContractState) =>
    createDataAttributes({
      'data-closed': state.closed,
      'data-disabled': state.disabled,
      'data-expanded': state.expanded,
      'data-invalid': state.invalid,
      'data-loading': state.loading,
    }),
}

export const multiSelectRecipe = /* @__PURE__ */ defineRecipe<
  MultiSelectStyleSlot,
  MultiSelectStyleVariant
>('multiSelect', {
  base: {
    ...SELECT_FAMILY_SLOTS,
    control: TAG_FIELD_CONTROL_CLASS,
    input: TAG_FIELD_INPUT_CLASS,
    trigger: SECONDARY_TRIGGER_CLASS,
    ...TAG_SLOTS,
    tagOverflow: 'text-muted-foreground px-1 flex items-center',
  },
  defaultVariants: { variant: 'outline', size: 'md' },
  variants: {
    variant: SELECT_TRIGGER_FIELD_VARIANTS,
    size: TAG_SIZES,
  },
})
