import { defineRecipe } from '../../theme/style/recipe'

import type { CardStyleSlot, CardStyleVariant } from './card.style-types'

export const cardRecipe = /* @__PURE__ */ defineRecipe<CardStyleSlot, CardStyleVariant>('card', {
  base: {
    root: 'bg-card text-card-foreground flex flex-col rounded-xl border border-border',
    header:
      'grid grid-cols-[minmax(0,1fr)_auto] auto-rows-min items-start first:rounded-t-[inherit]',
    title: 'col-start-1 font-medium leading-snug',
    description: 'col-start-1 text-muted-foreground',
    action: 'inline-flex row-span-2 col-start-2 row-start-1 self-start justify-self-end',
    body: 'flex-1',
    footer: 'flex items-center last:rounded-b-[inherit]',
  },
  defaultVariants: { variant: 'outline', size: 'md' },
  variants: {
    variant: {
      outline: {
        footer: 'border-t border-border',
      },
      subtle: {
        footer: 'border-t border-border bg-muted/50',
      },
      none: { root: '' },
    },
    size: {
      sm: {
        root: 'gap-3',
        header: 'px-3 pt-3 last:pb-3 gap-0.5',
        title: 'text-sm',
        description: 'text-xs',
        body: 'px-3 first:pt-3 last:pb-3 text-xs',
        footer: 'p-3 gap-2',
      },
      md: {
        root: 'gap-4',
        header: 'px-4 pt-4 last:pb-4 gap-1',
        title: 'text-base',
        description: 'text-sm',
        body: 'px-4 first:pt-4 last:pb-4 text-sm',
        footer: 'p-4 gap-3',
      },
      lg: {
        root: 'gap-5',
        header: 'px-5 pt-5 last:pb-5 gap-1.5',
        title: 'text-lg',
        description: 'text-base',
        body: 'px-5 first:pt-5 last:pb-5 text-base',
        footer: 'p-5 gap-4',
      },
    },
  },
})
