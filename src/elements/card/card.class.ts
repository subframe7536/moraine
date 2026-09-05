import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const CARD_BODY_MARGIN_DEFAULT_CLASS = 'mb-6'
export const CARD_BODY_MARGIN_COMPACT_CLASS = 'mb-4'

export const cardRecipe = recipe({
  base: {
    root: 'text-card-foreground border border-border rounded-xl bg-card flex flex-col shadow-xs relative overflow-hidden [html:not(.dark)_&]:bg-clip-padding',
    header: 'grid auto-rows-min items-start',
    title: 'text-base leading-normal font-medium',
    description: 'text-sm text-muted-foreground',
    action: 'inline-flex row-span-2 col-start-2 row-start-1 self-start justify-self-end',
    body: 'flex-1',
    footer: '',
  },
  defaultVariants: {
    compact: false,
  },
  variants: {
    compact: {
      false: {
        header: 'p-6 gap-1',
        body: 'px-6',
        footer: 'p-6',
      },
      true: {
        header: 'p-4 gap-1',
        body: 'px-4',
        footer: 'p-4',
      },
    },
  },
})

export type CardVariantProps = VariantProps<typeof cardRecipe>
