import { createDataAttributes } from '../../shared/style-contract.ts'
import type { DataAttributeContract } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'

import type { ResizableStyleSlot, ResizableStyleVariant } from './resizable.style-types'

export const resizableDataAttributes = {
  root: createDataAttributes('resizable-root'),
  panel: createDataAttributes('collapsed', 'expanded', 'resizing', 'transitioning'),
  handle: createDataAttributes('active', 'cross', 'dragging'),
  handleControl: createDataAttributes('collapse'),
  intersection: createDataAttributes(
    'resizable-handle-end-target',
    'resizable-handle-start-target',
  ),
} satisfies DataAttributeContract<keyof ResizableStyleSlot>

export const resizableRecipe = /* @__PURE__ */ defineRecipe<
  ResizableStyleSlot,
  ResizableStyleVariant
>('resizable', {
  base: {
    root: 'flex h-full min-h-0 min-w-0 w-full',
    panel:
      'min-h-0 min-w-0 overflow-auto data-transitioning:transition-flex-grow motion-reduce:transition-none',
    handle:
      "bg-border flex shrink-0 select-none items-center justify-center relative overflow-visible touch-none focus-visible:(outline-none ring-3 ring-ring/50) aria-disabled:cursor-default data-cross:cursor-move after:(content-[''] absolute)",
    handleControl:
      'rounded-lg bg-border flex shrink-0 cursor-inherit select-none items-center justify-center z-sticky touch-none focus-visible:(outline-none ring-3 ring-ring/50) data-collapse:active:cursor-pointer data-collapse:hover:cursor-pointer',
    intersection: 'border-0 bg-transparent h-2 w-2 cursor-move pointer-events-auto absolute z-base',
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-row',
        handle: 'w-px cursor-ew-resize after:(w-1.5 inset-y-0 left-1/2 -translate-x-1/2)',
        handleControl: 'h-6 w-1',
        intersection:
          'data-resizable-handle-start-target:top-0 data-resizable-handle-end-target:bottom-0 left-1/2 -translate-x-1/2',
      },
      vertical: {
        root: 'flex-col',
        handle: 'h-px w-full cursor-ns-resize after:(h-1.5 inset-x-0 top-1/2 -translate-y-1/2)',
        handleControl: 'h-1 w-6',
        intersection:
          'data-resizable-handle-start-target:left-0 data-resizable-handle-end-target:right-0 top-1/2 -translate-y-1/2',
      },
    },
  },
})
