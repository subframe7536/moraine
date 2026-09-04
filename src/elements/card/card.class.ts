import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const CARD_ROOT_CLASS =
  'text-card-foreground border border-border rounded-xl bg-card flex flex-col shadow-xs relative overflow-hidden [html:not(.dark)_&]:bg-clip-padding'

export const CARD_HEADER_CLASS = 'grid auto-rows-min items-start'
export const CARD_HEADER_DEFAULT_CLASS = 'p-6 gap-1'
export const CARD_HEADER_COMPACT_CLASS = 'p-4 gap-1'
export const CARD_TITLE_CLASS = 'text-base leading-normal font-medium'
export const CARD_DESCRIPTION_CLASS = 'text-sm text-muted-foreground'
export const CARD_ACTION_CLASS =
  'inline-flex row-span-2 col-start-2 row-start-1 self-start justify-self-end'
export const CARD_BODY_CLASS = 'flex-1'
export const CARD_BODY_DEFAULT_CLASS = 'px-6'
export const CARD_BODY_COMPACT_CLASS = 'px-4'
export const CARD_BODY_MARGIN_DEFAULT_CLASS = 'mb-6'
export const CARD_BODY_MARGIN_COMPACT_CLASS = 'mb-4'
export const CARD_FOOTER_DEFAULT_CLASS = 'p-6'
export const CARD_FOOTER_COMPACT_CLASS = 'p-4'

export const cardRecipe = recipe({
  slots: ['root', 'header', 'title', 'description', 'action', 'body', 'footer'],
  base: {
    root: CARD_ROOT_CLASS,
    header: CARD_HEADER_CLASS,
    title: CARD_TITLE_CLASS,
    description: CARD_DESCRIPTION_CLASS,
    action: CARD_ACTION_CLASS,
    body: CARD_BODY_CLASS,
    footer: '',
  },
  defaultVariants: {
    compact: false,
  },
  variants: {
    compact: {
      false: {
        header: CARD_HEADER_DEFAULT_CLASS,
        body: CARD_BODY_DEFAULT_CLASS,
        footer: CARD_FOOTER_DEFAULT_CLASS,
      },
      true: {
        header: CARD_HEADER_COMPACT_CLASS,
        body: CARD_BODY_COMPACT_CLASS,
        footer: CARD_FOOTER_COMPACT_CLASS,
      },
    },
  },
})

export type CardVariantProps = VariantProps<typeof cardRecipe>
