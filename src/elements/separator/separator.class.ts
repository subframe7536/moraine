import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const separatorRecipe = recipe({
  slots: ['root'],
  base: {
    root: 'border-current bg-border shrink-0',
  },
  defaultVariants: {
    size: 'sm',
    orientation: 'horizontal',
    type: 'solid',
  },
  variants: {
    size: {
      sm: { root: 'border-2' },
      md: { root: 'border-3' },
      lg: { root: 'border-4' },
    },
    orientation: {
      horizontal: { root: 'border-t h-px w-full' },
      vertical: { root: 'border-s h-full w-px' },
    },
    type: {
      solid: { root: 'border-solid' },
      dashed: { root: 'border-dashed' },
      dotted: { root: 'border-dotted' },
    },
  },
})

export const separatorVariants = separatorRecipe
export type SeparatorVariantProps = VariantProps<typeof separatorRecipe>
