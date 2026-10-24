import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { TreeStyleSlot, TreeStyleVariants } from './tree.style-types'

export const treeDataAttributes = {
  item: /* @__PURE__ */ createDataAttributes(
    'checked',
    'disabled',
    'entering',
    'expanded',
    'indeterminate',
    'leaf',
    'loading',
    'selected',
  ),
  row: /* @__PURE__ */ createDataAttributes('disabled', 'expanded', 'leaf', 'selected'),
  trigger: /* @__PURE__ */ createDataAttributes('expanded', 'leaf', 'loading'),
  icon: /* @__PURE__ */ createDataAttributes('expanded', 'leaf'),
  content: /* @__PURE__ */ createDataAttributes('closed', 'expanded'),
} satisfies DataAttributeContract<keyof TreeStyleSlot>

/** Keeps the chevron pointing toward the content direction in right-to-left layouts. */
export const TREE_TRIGGER_ICON_CLASS = 'rtl:-scale-x-100'

export const treeRecipe = /* @__PURE__ */ defineRecipe<TreeStyleSlot, TreeStyleVariants>('tree', {
  base: {
    '--mo-collapsible-content-height': '0px',
    '--mo-tree-level': 0,
    root: 'text-foreground flex flex-col min-h-0 w-full',
    virtualContainer: 'flex-1 min-h-0 relative overflow-auto',
    item: 'outline-none data-entering:animate-tree-item-in motion-reduce:animate-none',
    row: `pe-2 ps-[calc(0.5rem_+_var(--mo-tree-level)*var(--mo-tree-indent,1.25rem))] rounded-md flex cursor-pointer select-none items-center hover:bg-accent-hover [[role=treeitem]:focus-visible>&]:ring-3 [[role=treeitem]:focus-visible>&]:ring-ring/50 ${DATA_DISABLED_CLASS}`,
    trigger:
      'opacity-70 inline-flex shrink-0 transition-transform items-center justify-center data-leaf:invisible data-expanded:rotate-90 data-loading:rotate-0 data-loading:animate-spin',
    icon: 'opacity-70 shrink-0',
    label: 'flex-1 min-w-0 truncate',
    content:
      'h-(--mo-collapsible-content-height) overflow-hidden data-closed:(h-0 animate-accordion-up) data-expanded:animate-accordion-down motion-reduce:animate-none',
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle',
  },
  variants: {
    size: {
      sm: { row: 'text-xs gap-1.5 min-h-7', trigger: 'size-3.5', icon: 'size-3.5' },
      md: { row: 'text-sm gap-2 min-h-8', trigger: 'size-4', icon: 'size-4' },
      lg: { row: 'text-base gap-2.5 min-h-10', trigger: 'size-5', icon: 'size-5' },
    },
    variant: {
      subtle: { row: 'data-selected:(text-accent-foreground bg-accent)' },
      solid: { row: 'data-selected:(text-primary-foreground bg-primary)' },
    },
  },
})
