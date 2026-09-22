import { BUTTON_VARIANTS } from '../../elements/button/button.recipe.ts'
import { createDataAttributes } from '../../shared/style-contract.ts'
import type { DataAttributeContract } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'

import type { PaginationStyleSlot, PaginationStyleVariant } from './pagination.style-types'

export const paginationDataAttributes = {
  prev: createDataAttributes('disabled', 'loading', 'text'),
  item: createDataAttributes('current', 'disabled', 'loading'),
  next: createDataAttributes('disabled', 'loading', 'text'),
  ellipsis: createDataAttributes('ellipsis'),
} satisfies DataAttributeContract<keyof PaginationStyleSlot>

export const paginationRecipe = /* @__PURE__ */ defineRecipe<
  PaginationStyleSlot,
  PaginationStyleVariant
>('pagination', {
  base: {
    root: 'mx-auto flex w-full justify-center',
    list: 'flex gap-1 items-center justify-center',
    listItem: 'flex items-center justify-center',
    item: 'outline-none',
    prev: 'data-text:ps-2!',
    next: 'data-text:pe-2!',
    ellipsis: '',
    controlLabel: 'hidden sm:block',
  },
  defaultVariants: {
    size: 'md',
    variant: 'ghost',
    activeVariant: 'outline',
    controlVariant: 'ghost',
  },
  variants: {
    size: {
      sm: {
        listItem: 'data-ellipsis:size-7',
        ellipsis: 'text-sm',
      },
      md: {
        listItem: 'data-ellipsis:size-8',
        ellipsis: 'text-sm',
      },
      lg: {
        listItem: 'data-ellipsis:size-9',
        ellipsis: 'text-base',
      },
    },
    variant: BUTTON_VARIANTS,
    activeVariant: BUTTON_VARIANTS,
    controlVariant: BUTTON_VARIANTS,
  },
})
