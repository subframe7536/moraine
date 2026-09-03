import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const sheetContentVariants = recipe({
  base: 'text-sm text-popover-foreground outline-none bg-popover flex flex-col gap-4 max-h-full min-h-0 min-w-0 shadow-lg fixed z-floating bg-clip-padding data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0] data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0] motion-reduce:animate-none',
  defaultVariants: {
    side: 'right',
    inset: false,
  },
  variants: {
    side: {
      top: 'border-b border-border h-auto [--mo-enter-translate-y:-2.5rem] [--mo-exit-translate-y:-2.5rem] inset-x-0 top-0',
      right:
        'border-l border-border h-full w-3/4 [--mo-enter-translate-x:2.5rem] [--mo-exit-translate-x:2.5rem] inset-y-0 right-0 sm:max-w-sm',
      bottom:
        'border-t border-border h-auto [--mo-enter-translate-y:2.5rem] [--mo-exit-translate-y:2.5rem] inset-x-0 bottom-0',
      left: 'border-r border-border h-full w-3/4 [--mo-enter-translate-x:-2.5rem] [--mo-exit-translate-x:-2.5rem] inset-y-0 left-0 sm:max-w-sm',
    },
    inset: {
      true: 'sm:m-4 sm:border sm:border-border sm:rounded-2xl',
      false: 'rounded-none',
    },
  },
})

export type SheetVariantProps = VariantProps<typeof sheetContentVariants>
