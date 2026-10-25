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
  row: /* @__PURE__ */ createDataAttributes('disabled', 'entering', 'expanded', 'leaf', 'selected'),
  trigger: /* @__PURE__ */ createDataAttributes('expanded', 'leaf', 'loading'),
  icon: /* @__PURE__ */ createDataAttributes('expanded', 'leaf'),
  content: /* @__PURE__ */ createDataAttributes('closed', 'expanded', 'transition'),
} satisfies DataAttributeContract<keyof TreeStyleSlot>

/** Keeps the chevron pointing toward the content direction in right-to-left layouts. */
export const TREE_TRIGGER_ICON_CLASS = 'rtl:-scale-x-100'

const TREE_INDENT_GUIDE_CLASS =
  '[background-image:repeating-linear-gradient(to_right,var(--mo-tree-indent-guide,var(--border))_0_1px,transparent_1px_var(--mo-tree-indent,1.25rem))] [background-position:var(--mo-tree-guide-offset,1rem)_0] [background-size:calc(var(--mo-tree-level)*var(--mo-tree-indent,1.25rem))_100%] bg-no-repeat'

export const treeRecipe = /* @__PURE__ */ defineRecipe<TreeStyleSlot, TreeStyleVariants>('tree', {
  base: {
    '--mo-collapsible-content-height': '0px',
    '--mo-tree-level': 0,
    '--mo-tree-guide-offset': '1rem',
    root: 'text-foreground min-h-0 w-full relative',
    item: `outline-none relative ${TREE_INDENT_GUIDE_CLASS}`,
    row: `mx-1 pe-2 ps-[calc(0.5rem_+_var(--mo-tree-level)*var(--mo-tree-indent,1.25rem))] rounded-md flex min-w-0 cursor-pointer select-none items-center [[role=treeitem]:focus-visible>&]:ring-3 [[role=treeitem]:focus-visible>&]:ring-ring/50 data-entering:animate-tree-item-in motion-reduce:animate-none hover:not-[[data-selected]]:bg-accent-hover ${DATA_DISABLED_CLASS}`,
    trigger:
      'opacity-70 inline-flex shrink-0 transition-transform items-center justify-center overflow-visible data-leaf:invisible data-expanded:rotate-90 data-loading:rotate-0 data-loading:animate-spin',
    icon: 'opacity-70 shrink-0',
    label: 'flex-1 min-w-0 truncate',
    content:
      'data-transition:h-(--mo-collapsible-content-height) data-transition:overflow-hidden data-transition:data-closed:(h-0 animate-accordion-up) data-transition:data-expanded:animate-accordion-down data-transition:motion-reduce:animate-none',
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle',
  },
  variants: {
    size: {
      sm: {
        row: 'text-xs gap-1.5 min-h-7',
        trigger: 'size-3.5',
        icon: 'size-3.5',
        '--mo-tree-guide-offset': '0.9375rem',
      },
      md: { row: 'text-sm gap-2 min-h-8', trigger: 'size-4', icon: 'size-4' },
      lg: {
        row: 'text-base gap-2.5 min-h-10',
        trigger: 'size-5',
        icon: 'size-5',
        '--mo-tree-guide-offset': '1.125rem',
      },
    },
    variant: {
      subtle: { row: 'data-selected:(text-accent-foreground bg-accent)' },
      solid: {
        row: 'data-selected:(text-primary-foreground bg-primary active:bg-primary-active hover:bg-primary-hover)',
      },
    },
  },
})
