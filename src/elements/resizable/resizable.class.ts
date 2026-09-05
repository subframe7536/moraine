import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const RESIZABLE_HANDLE_GRIP_CLASS =
  'rounded-lg flex cursor-inherit items-center justify-center z-sticky focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 touch-none select-none'

export const resizableRecipe = recipe({
  slots: ['root', 'panel', 'divider', 'handle', 'crossTarget'],
  base: {
    root: 'flex h-full min-h-0 min-w-0 w-full',
    panel: '',
    divider:
      "bg-border flex shrink-0 select-none items-center justify-center relative overflow-visible touch-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-default data-cross:cursor-move after:content-[''] after:absolute",
    handle: '',
    crossTarget: 'border-0 bg-transparent h-2 w-2 cursor-move pointer-events-auto absolute z-base',
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-row',
        divider:
          'w-px cursor-ew-resize after:w-1.5 after:inset-y-0 after:left-1/2 after:-translate-x-1/2',
        crossTarget: 'left-1/2 -translate-x-1/2',
      },
      vertical: {
        root: 'flex-col',
        divider:
          'h-px w-full cursor-ns-resize after:h-1.5 after:inset-x-0 after:top-1/2 after:-translate-y-1/2',
        crossTarget: 'top-1/2 -translate-y-1/2',
      },
    },
  },
})

export const resizableCrossTargetVariants = recipe({
  base: 'border-0 bg-transparent h-2 w-2 cursor-move pointer-events-auto absolute z-base',
  defaultVariants: { orientation: 'horizontal', target: 'start' },
  variants: {
    orientation: {
      horizontal: 'left-1/2 -translate-x-1/2',
      vertical: 'top-1/2 -translate-y-1/2',
    },
    target: { start: '', end: '' },
  },
  compoundVariants: [
    {
      variants: { orientation: 'horizontal', target: 'start' },
      class: 'top-0',
    },
    {
      variants: { orientation: 'horizontal', target: 'end' },
      class: 'bottom-0',
    },
    {
      variants: { orientation: 'vertical', target: 'start' },
      class: 'left-0',
    },
    {
      variants: { orientation: 'vertical', target: 'end' },
      class: 'right-0',
    },
  ],
})

export type ResizableVariantProps = VariantProps<typeof resizableRecipe>
