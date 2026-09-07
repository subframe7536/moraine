import { recipe } from '../../shared/style/recipe.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'

export const commandPaletteRecipeOptions = {
  base: {
    root: 'bg-popover text-popover-foreground border border-border rounded-lg flex flex-col min-h-0 shadow-md overflow-hidden',
    inputWrapper: 'px-2.5 gap-2 h-11 border-b border-border/60 flex items-center',
    input:
      'outline-none bg-transparent flex-1 placeholder:text-muted-foreground disabled:opacity-64 disabled:pointer-events-none text-sm h-10 w-full',
    listbox: 'no-scrollbar max-h-72 scroll-py-1 p-1 outline-none overflow-x-hidden overflow-y-auto',
    footer: 'text-sm text-muted-foreground p-3',
    group: 'text-foreground overflow-hidden leading-loose mt-2',
    label: 'text-muted-foreground px-2 py-1.5 text-xs font-medium',
    item: 'text-sm px-2 py-1 min-h-8 text-foreground outline-none rounded-sm flex gap-2 w-full cursor-default select-none items-center relative data-highlighted:bg-muted data-disabled:opacity-50 data-disabled:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4',
    itemLeading: 'text-muted-foreground shrink-0 [&_svg]:size-4',
    itemWrapper:
      'text-start flex flex-1 flex-col min-w-0 data-[description-position=trailing]:flex-row data-[description-position=trailing]:gap-2 data-[description-position=trailing]:items-baseline',
    itemLabel:
      'min-w-0 truncate items-baseline data-[description-position=trailing]:flex data-[description-position=trailing]:flex-1 data-[description-position=trailing]:gap-2',
    itemDescription: 'text-xs text-muted-foreground truncate',
    itemTrailing:
      'text-muted-foreground ml-auto flex shrink-0 gap-2 items-center text-xs tracking-widest',
    search:
      'text-muted-foreground opacity-50 shrink-0 pointer-events-none data-loading:animate-spin',
    close:
      'text-muted-foreground outline-none border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center hover:text-foreground',
    empty: 'text-muted-foreground py-6 text-center text-sm',
  },
  variants: {},
} as const

export const commandPaletteRecipe = recipe(commandPaletteRecipeOptions)

export type CommandPaletteVariantProps = VariantProps<typeof commandPaletteRecipe>
