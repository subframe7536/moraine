import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { PaginationStyleSlot, PaginationStyleVariant } from './pagination.style-types'

export const paginationDataAttributes = {
  prev: /* @__PURE__ */ createDataAttributes('disabled', 'loading', 'text'),
  item: /* @__PURE__ */ createDataAttributes('current', 'disabled', 'loading'),
  next: /* @__PURE__ */ createDataAttributes('disabled', 'loading', 'text'),
  ellipsis: /* @__PURE__ */ createDataAttributes('ellipsis'),
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
  },
})
