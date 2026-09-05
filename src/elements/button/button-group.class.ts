import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const buttonGroupRecipe = recipe({
  base: {
    root: 'inline-flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-sticky',
    separator: 'bg-input shrink-0 self-stretch',
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-row [&>[data-slot=separator]]:mx-px [&>*:not(:first-child)]:border-s-0 [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none',
        separator: 'h-full w-px',
      },
      vertical: {
        root: 'flex-col [&>[data-slot=separator]]:my-px [&>*:not(:first-child)]:border-t-0 [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none',
        separator: 'h-px w-full',
      },
    },
  },
})

export type ButtonGroupLayoutVariantProps = VariantProps<typeof buttonGroupRecipe>
