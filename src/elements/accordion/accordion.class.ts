import { slotRecipe } from '../../shared/style/recipe.ts'

import type { AccordionT } from './accordion.types.ts'

export const accordionRecipe = /* @__PURE__ */ slotRecipe<AccordionT.Slot, AccordionT.Variant>({
  base: {
    root: 'flex flex-col w-full data-disabled:(opacity-64 pointer-events-none)',
    item: '[&:not(:last-child)]:(border-b border-border) data-disabled:(opacity-64 pointer-events-none)',
    header: 'flex',
    trigger:
      'group text-sm font-medium py-3 text-left outline-none border border-transparent rounded-md flex flex-1 min-w-0 w-full items-center justify-between relative focus-visible:(outline-none border-ring ring-3 ring-ring/50) disabled:(opacity-64 pointer-events-none) hover:underline cursor-pointer',
    leading: 'shrink-0 mr-1.5',
    label: 'text-start break-words',
    trailing:
      'text-muted-foreground ml-auto shrink-0 size-4 pointer-events-none transition-transform group-aria-expanded:rotate-180',
    content:
      'text-sm h-(--mo-collapsible-content-height) overflow-hidden data-expanded:animate-accordion-down data-closed:(h-0 animate-accordion-up) motion-reduce:animate-none',
    contentInner: 'pt-0 pb-4',
  },
})
