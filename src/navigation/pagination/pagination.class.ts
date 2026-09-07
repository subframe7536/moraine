import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const PAGINATION_CONTROL_LABEL_CLASS = 'hidden sm:block'

export const paginationRecipeOptions = {
  base: {
    root: 'mx-auto flex w-full justify-center',
    list: 'flex gap-1 items-center justify-center',
    item: 'flex items-center justify-center data-ellipsis:size-9',
    link: 'outline-none',
    prev: 'data-text:ps-2!',
    next: 'data-text:pe-2!',
    ellipsis: '',
    controlLabel: PAGINATION_CONTROL_LABEL_CLASS,
  },
  variants: {},
} as const

export const paginationRecipe = recipe(paginationRecipeOptions)

export type PaginationVariantProps = VariantProps<typeof paginationRecipe>
