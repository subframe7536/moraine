import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const COMMAND_PALETTE_ROOT_CLASS =
  'bg-popover text-popover-foreground border border-border rounded-lg flex flex-col min-h-0 shadow-md overflow-hidden'
export const COMMAND_PALETTE_INPUT_WRAPPER_CLASS =
  'px-2.5 gap-2 h-11 border-b border-border/60 flex items-center'
export const COMMAND_PALETTE_INPUT_CLASS = 'text-sm h-10 w-full'
export const COMMAND_PALETTE_LIST_CLASS =
  'no-scrollbar max-h-72 scroll-py-1 p-1 outline-none overflow-x-hidden overflow-y-auto'
export const COMMAND_PALETTE_EMPTY_CLASS = 'text-muted-foreground py-6 text-center text-sm'
export const COMMAND_PALETTE_GROUP_CLASS = 'text-foreground overflow-hidden'
export const COMMAND_PALETTE_LABEL_CLASS = 'text-muted-foreground px-2 py-1.5 text-xs font-medium'
export const COMMAND_PALETTE_TRAILING_CLASS =
  'text-muted-foreground ml-auto flex shrink-0 gap-2 items-center text-xs tracking-widest'

export const commandPaletteItemVariants = cva(
  'text-foreground outline-none rounded-sm flex gap-2 w-full cursor-default select-none items-center relative data-highlighted:bg-muted data-disabled:(opacity-50 pointer-events-none) [&_svg]:shrink-0 [&_svg]:size-4',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'text-xs px-2 py-1.5 min-h-7',
        md: 'text-sm px-2 py-1.5 min-h-8',
        lg: 'text-sm px-3 py-1.5 min-h-9',
      },
    },
  },
)

export type CommandPaletteItemVariantProps = VariantProps<typeof commandPaletteItemVariants>
