import { defineRecipe } from '../../theme/recipe'

import type { CardStyleSlot, CardStyleVariant } from './card.style-types'

export const cardRecipe = /* @__PURE__ */ defineRecipe<CardStyleSlot, CardStyleVariant>('card', {
  base: {
    root: 'text-card-foreground border border-border rounded-xl bg-card flex flex-col shadow-surface',
    header:
      'grid auto-rows-min grid-cols-[minmax(0,1fr)_auto] items-start first:rounded-t-[inherit]',
    title: 'leading-snug font-medium col-start-1',
    description: 'text-muted-foreground col-start-1',
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
    },
    size: {
      sm: {
        root: 'gap-3',
        header: 'px-3 pt-3 gap-0.5 last:pb-3',
        title: 'text-sm',
        description: 'text-xs',
        body: 'text-xs px-3 first:pt-3 last:pb-3',
        footer: 'p-3 gap-2',
      },
      md: {
        root: 'gap-4',
        header: 'px-4 pt-4 gap-1 last:pb-4',
        title: 'text-base',
        description: 'text-sm',
        body: 'text-sm px-4 first:pt-4 last:pb-4',
        footer: 'p-4 gap-3',
      },
      lg: {
        root: 'gap-5',
        header: 'px-5 pt-5 gap-1.5 last:pb-5',
        title: 'text-lg',
        description: 'text-base',
        body: 'text-base px-5 first:pt-5 last:pb-5',
        footer: 'p-5 gap-4',
      },
    },
  },
})
