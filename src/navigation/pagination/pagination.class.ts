import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const PAGINATION_CONTROL_LABEL_CLASS = 'hidden sm:block'

export const paginationRecipe = recipe({
  base: {
    root: 'mx-auto flex w-full justify-center',
    list: 'flex gap-1 items-center justify-center',
    item: 'flex items-center justify-center',
    link: 'outline-none',
    prev: '',
    next: '',
    ellipsis: '',
  },
})

export type PaginationVariantProps = VariantProps<typeof paginationRecipe>
