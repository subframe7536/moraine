import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const kbdRecipe = recipe({
  base: 'leading-none font-medium font-mono px-1 rounded-sm inline-flex select-none uppercase items-center justify-center',
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
  variants: {
    size: {
      sm: 'text-[10px] h-4.5 min-w-4.5',
      md: 'text-xs h-5 min-w-5',
      lg: 'text-sm h-5.5 min-w-5.5',
    },
    variant: {
      default: 'text-muted-foreground bg-muted',
      outline: 'text-muted-foreground border border-b-2 border-border',
      invert: 'text-muted bg-muted-foreground',
    },
  },
})

export const kbdGroupRecipe = recipe({
  base: {
    root: 'inline-flex gap-1 items-center',
    chord: 'inline-flex gap-1 items-center',
    item: '',
    divider: 'text-muted-foreground',
    sequenceDivider: 'text-muted-foreground',
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: { root: 'text-[11px]' },
      md: { root: 'text-xs' },
      lg: { root: 'text-xs' },
    },
  },
})

export type KbdVariantProps = VariantProps<typeof kbdRecipe>
export type KbdGroupVariantProps = VariantProps<typeof kbdGroupRecipe>
