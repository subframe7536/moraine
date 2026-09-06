import { recipe } from '../../shared/style/recipe.ts'
import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'

import type { AccordionT } from './accordion.types.ts'

export const accordionRecipeOptions = {
  base: {
    root: 'flex flex-col w-full data-disabled:opacity-64 data-disabled:pointer-events-none',
    item: '[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border data-disabled:opacity-64 data-disabled:pointer-events-none',
    header: 'flex',
    trigger:
      'group text-sm font-medium py-3 text-left outline-none border border-transparent rounded-md flex flex-1 min-w-0 w-full items-center justify-between relative focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-64 disabled:pointer-events-none hover:underline cursor-pointer',
    leading: 'shrink-0 mr-1.5',
    label: 'text-start break-words',
    trailing:
      'text-muted-foreground ml-auto shrink-0 size-4 pointer-events-none transition-transform group-aria-expanded:rotate-180 duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    content:
      'text-sm h-[var(--mo-collapsible-content-height)] overflow-hidden data-expanded:animate-accordion-down data-closed:h-0 data-closed:animate-accordion-up motion-reduce:animate-none',
    contentInner: 'pt-0 pb-4',
  },
} as const satisfies SlotRecipeOptions<keyof AccordionT.Slot>

export const accordionRecipe = recipe(accordionRecipeOptions)
