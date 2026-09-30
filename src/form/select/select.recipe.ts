import { createDataAttributes } from '../../shared/style-contract'
import type { DataAttributeContract } from '../../shared/style-contract'
import { defineRecipe } from '../../theme/recipe'
import { baseSelectDataAttributes } from '../base-select/base-select.recipe'
import {
  FIELD_SIZES,
  PRIMARY_TRIGGER_CLASS,
  SELECT_LOADING_ICON_CLASS,
  SELECT_FAMILY_SLOTS,
  SELECT_TRIGGER_FIELD_VARIANTS,
} from '../shared/select/select-field.recipe'

import type { SelectStyleSlot, SelectStyleVariant } from './select.style-types'

export const selectDataAttributes = {
  ...baseSelectDataAttributes,
  trailing: createDataAttributes('loading'),
  value: createDataAttributes('placeholder'),
} satisfies DataAttributeContract<keyof SelectStyleSlot>

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
    variants: {
      variant: {
        ...SELECT_TRIGGER_FIELD_VARIANTS,
        ghost: {
          ...SELECT_TRIGGER_FIELD_VARIANTS.ghost,
          value:
            'group-hover/select-control:data-placeholder:text-accent-foreground group-focus-within/select-control:data-placeholder:text-accent-foreground',
        },
      },
      size: FIELD_SIZES,
    },
  } as const,
)
