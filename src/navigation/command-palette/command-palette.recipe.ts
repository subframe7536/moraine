import { defineRecipe } from '../../theme/recipe'
import { DISABLED_CLASS, HIGHLIGHTED_MUTED_TEXT_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type {
  CommandPaletteStyleSlot,
  CommandPaletteStyleVariant,
} from './command-palette.style-types'

export const commandPaletteDataAttributes = {
  item: /* @__PURE__ */ createDataAttributes('disabled', 'highlighted'),
  itemLeading: /* @__PURE__ */ createDataAttributes('highlighted'),
  itemDescription: /* @__PURE__ */ createDataAttributes('highlighted'),
  itemTrailing: /* @__PURE__ */ createDataAttributes('highlighted'),
  inputLeading: /* @__PURE__ */ createDataAttributes('loading'),
} satisfies DataAttributeContract<keyof CommandPaletteStyleSlot>

export const commandPaletteRecipe = /* @__PURE__ */ defineRecipe<
  CommandPaletteStyleSlot,
  CommandPaletteStyleVariant
>('commandPalette', {
  base: {
    root: 'text-popover-foreground border border-border rounded-lg bg-popover flex flex-col min-h-0 shadow-overlay overflow-hidden',
    inputWrapper: 'px-2.5 border-b border-border/60 flex gap-2 h-11 items-center',
    input: `outline-none bg-transparent flex-1 placeholder:text-muted-foreground ${DISABLED_CLASS} text-sm h-10 w-full`,
    listbox:
      'p-1 outline-none max-h-72 [scrollbar-width:none] overflow-x-hidden overflow-y-auto scroll-py-1 [&::-webkit-scrollbar]:hidden',
    footer: 'text-sm text-muted-foreground p-3',
    group: 'text-foreground mt-1 overflow-hidden first:mt-0',
    groupLabel: 'text-xs text-muted-foreground leading-4 font-medium px-2 py-1 block',
    item: 'group text-sm text-foreground px-2 py-1 outline-none rounded-sm flex gap-2 min-h-8 w-full cursor-default select-none items-center relative data-highlighted:text-accent-foreground data-highlighted:bg-accent-hover data-disabled:(opacity-50 pointer-events-none) [&_svg]:(shrink-0 size-4)',
    itemLeading: `${HIGHLIGHTED_MUTED_TEXT_CLASS} shrink-0 [&_svg]:size-4`,
    itemWrapper: 'text-start flex flex-1 flex-col min-w-0',
    itemLabel: 'min-w-0 truncate items-baseline',
    itemDescription: `text-xs ${HIGHLIGHTED_MUTED_TEXT_CLASS} truncate`,
    itemTrailing: `text-xs ${HIGHLIGHTED_MUTED_TEXT_CLASS} tracking-widest ml-auto flex shrink-0 gap-2 items-center [&_[data-slot=kbd-group]]:text-inherit`,
    inputLeading:
      'text-muted-foreground opacity-50 shrink-0 pointer-events-none data-loading:animate-spin',
    close:
      'text-muted-foreground outline-none border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center active:(text-accent-foreground bg-accent-active) hover:(text-accent-foreground bg-accent-hover)',
    empty: 'text-sm text-muted-foreground py-6 text-center',
  },
  defaultVariants: {
    descriptionPosition: 'bottom',
  },
  variants: {
    descriptionPosition: {
      trailing: {
        itemWrapper: 'flex-row gap-2 items-baseline',
        itemLabel: 'flex flex-1 gap-2',
      },
    },
  },
})
