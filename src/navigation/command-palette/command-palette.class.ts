import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const COMMAND_PALETTE_ROOT_CLASS =
  'bg-popover text-popover-foreground rounded-xl! p-1 flex flex-col min-h-0'
export const COMMAND_PALETTE_INPUT_WRAPPER_CLASS =
  'bg-input/30 border-input/30 p-1 pb-0 flex gap-2 h-8 rounded-lg! border shadow-none! items-center'
export const COMMAND_PALETTE_INPUT_CLASS = 'w-full text-sm'
export const COMMAND_PALETTE_LIST_CLASS =
  'no-scrollbar max-h-72 scroll-py-1 outline-none overflow-x-hidden overflow-y-auto'
export const COMMAND_PALETTE_EMPTY_CLASS = 'text-muted-foreground py-6 text-center text-sm'
export const COMMAND_PALETTE_GROUP_CLASS = 'text-foreground overflow-hidden p-1'
export const COMMAND_PALETTE_LABEL_CLASS = 'text-muted-foreground px-2 py-1.5 text-xs font-medium'
export const COMMAND_PALETTE_TRAILING_CLASS =
  'text-muted-foreground ml-auto flex shrink-0 gap-2 items-center text-xs tracking-widest'

export const commandPaletteItemVariants = cva(
  'text-foreground outline-none rounded-sm flex gap-2 w-full cursor-default select-none items-center relative data-highlighted:bg-muted data-disabled:(opacity-50 pointer-events-none)',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs px-2 py-1 min-h-6',
        sm: 'text-xs px-2 py-1.5 min-h-7',
        md: 'text-sm px-2 py-1.5 min-h-8',
        lg: 'text-sm px-3 py-1.5 min-h-9',
        xl: 'text-base px-3.5 py-1.5 min-h-10',
      },
    },
  },
)

export type CommandPaletteItemVariantProps = VariantProps<typeof commandPaletteItemVariants>
