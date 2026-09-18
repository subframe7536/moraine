import { defineRecipe } from '../../theme/style/recipe'

import type { PaginationStyleSlot, PaginationStyleVariant } from './pagination.style-types'

export const paginationRecipe = /* @__PURE__ */ defineRecipe<
  PaginationStyleSlot,
  PaginationStyleVariant
>('pagination', {
  base: {
    root: 'mx-auto flex w-full justify-center',
    list: 'flex gap-1 items-center justify-center',
    listItem: 'flex items-center justify-center data-ellipsis:size-9',
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
})
