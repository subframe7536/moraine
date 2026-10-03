import { defineRecipe } from '../../theme/recipe'
import {
  DATA_DISABLED_CLASS,
  DISABLED_CLASS,
  FOCUS_VISIBLE_CLASS,
} from '../../theme/recipe-common.class'
import type { DataAttributeContract } from '../../theme/style-contract'
import { createDataAttributes } from '../../theme/style-contract'

import type { AccordionStyleSlot } from './accordion.style-types'

export const accordionDataAttributes = {
  root: createDataAttributes('disabled'),
  item: createDataAttributes('closed', 'disabled', 'expanded'),
  trigger: createDataAttributes('closed', 'disabled', 'expanded'),
  content: createDataAttributes('closed', 'expanded'),
} satisfies DataAttributeContract<keyof AccordionStyleSlot>

export const accordionRecipe = /* @__PURE__ */ defineRecipe<AccordionStyleSlot>('accordion', {
  base: {
    root: `flex flex-col w-full ${DATA_DISABLED_CLASS}`,
    item: `[&:not(:last-child)]:(border-b border-border) ${DATA_DISABLED_CLASS}`,
    header: 'flex',
    trigger: `group text-sm font-medium py-3 text-left outline-none border border-transparent rounded-md flex flex-1 min-w-0 w-full items-center justify-between relative ${FOCUS_VISIBLE_CLASS}  ${DISABLED_CLASS} cursor-pointer hover:underline`,
    leading: 'mr-1.5 shrink-0',
    label: 'text-start break-words',
    trailing:
      'text-muted-foreground ml-auto shrink-0 size-4 pointer-events-none transition-transform group-aria-expanded:rotate-180',
    content:
      'text-sm h-(--mo-collapsible-content-height) overflow-hidden data-closed:(h-0 animate-accordion-up) data-expanded:animate-accordion-down motion-reduce:animate-none',
    body: 'pb-4 pt-0',
  },
})
