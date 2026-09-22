import { createDataAttributes } from '../../shared/style-contract.ts'
import type { StyleContractState } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe.ts'
import { baseSelectDataAttributes } from '../base-select/base-select.recipe.ts'
import {
  FIELD_SIZES,
  PRIMARY_TRIGGER_CLASS,
  SELECT_LOADING_ICON_CLASS,
  SELECT_FAMILY_SLOTS,
  SELECT_TRIGGER_FIELD_VARIANTS,
} from '../shared/select/select-field.recipe.ts'

import type { SelectStyleSlot, SelectStyleVariant } from './select.style-types'

export const selectDataAttributes = {
  ...baseSelectDataAttributes,
  trailing: (state: StyleContractState) => createDataAttributes({ 'data-loading': state.loading }),
  value: (state: StyleContractState) =>
    createDataAttributes({ 'data-placeholder': state.placeholder }),
}

export const selectRecipe = /* @__PURE__ */ defineRecipe<SelectStyleSlot, SelectStyleVariant>(
  'select',
  {
    base: {
      ...SELECT_FAMILY_SLOTS,
      trigger: PRIMARY_TRIGGER_CLASS,
      trailing: SELECT_LOADING_ICON_CLASS,
      value: 'flex-1 min-w-0 truncate py-1.5 data-placeholder:text-muted-foreground',
    },
    defaultVariants: { variant: 'outline', size: 'md' },
    variants: { variant: SELECT_TRIGGER_FIELD_VARIANTS, size: FIELD_SIZES },
  } as const,
)
