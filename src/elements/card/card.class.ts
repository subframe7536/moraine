import { slotRecipe } from '../../shared/style/recipe'

import type { CardT } from './card.types'

export const cardRecipe = /* @__PURE__ */ slotRecipe<CardT.Slot, CardT.Variant>({
  base: {
    root: 'text-card-foreground border border-border rounded-xl bg-card flex flex-col shadow-xs relative overflow-hidden [html:not(.dark)_&]:bg-clip-padding',
    header: 'grid auto-rows-min items-start data-action:grid-cols-[1fr_auto]',
    title: 'text-base leading-normal font-medium',
    description: 'text-sm text-muted-foreground',
    action: 'inline-flex row-span-2 col-start-2 row-start-1 self-start justify-self-end',
    body: 'flex-1',
    footer: '',
  },
  defaults: {
    compact: false,
  },
  variants: {
    compact: {
      false: {
        header: 'p-6 gap-1',
        body: 'px-6 data-no-footer:mb-6',
        footer: 'p-6',
      },
      true: {
        header: 'p-4 gap-1',
        body: 'px-4 data-no-footer:mb-4',
        footer: 'p-4',
      },
    },
  },
})
