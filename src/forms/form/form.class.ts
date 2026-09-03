import { recipe } from '../../shared/style/recipe.ts'

export const FORM_ROOT_CLASS = 'w-full space-y-4 data-submitting:opacity-80'

export const formRecipe = recipe({
  slots: ['root'],
  base: {
    root: FORM_ROOT_CLASS,
  },
})
