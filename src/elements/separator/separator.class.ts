import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const separatorRecipe = recipe({
  base: 'border-current bg-border shrink-0',
  defaultVariants: {
    size: 'sm',
    orientation: 'horizontal',
    type: 'solid',
  },
  variants: {
    size: {
      sm: 'border-2',
      md: 'border-3',
      lg: 'border-4',
    },
    orientation: {
      horizontal: 'border-t h-px w-full',
      vertical: 'border-s h-full w-px',
    },
    type: {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    },
  },
})

export type SeparatorVariantProps = VariantProps<typeof separatorRecipe>
