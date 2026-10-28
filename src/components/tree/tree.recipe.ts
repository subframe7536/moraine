import type { JSX } from 'solid-js'

import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { TreeStyleSlot, TreeStyleVariants } from './tree.style-types'

export const treeDataAttributes = {
  item: /* @__PURE__ */ createDataAttributes(
    'checked',
    'disabled',
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

export const TREE_INDENT_GUIDE_STYLE = /* @__PURE__ */ {
  'background-image':
    'repeating-linear-gradient(to right, var(--mo-tree-indent-guide) 0 1px, transparent 1px var(--mo-tree-indent))',
  'background-position': 'var(--mo-tree-guide-offset) 0',
  'background-size': 'calc(var(--mo-tree-level) * var(--mo-tree-indent)) 100%',
  'background-repeat': 'no-repeat',
} satisfies JSX.CSSProperties

export const treeRecipe = /* @__PURE__ */ defineRecipe<TreeStyleSlot, TreeStyleVariants>('tree', {
  base: {
    '--mo-collapsible-content-height': '0px',
    '--mo-tree-level': 0,
    '--mo-tree-gutter': '0.25rem',
    '--mo-tree-pad': '0.5rem',
    '--mo-tree-guide-offset':
      'calc(var(--mo-tree-gutter) + var(--mo-tree-pad) + var(--mo-tree-trigger) / 2 - 0.5px)',
    '--mo-tree-inset': 'calc(var(--mo-tree-pad) + var(--mo-tree-level) * var(--mo-tree-indent))',
    root: 'text-foreground min-h-0 w-full relative',
    item: 'outline-none relative',
    row: `mx-(--mo-tree-gutter) pe-2 ps-(--mo-tree-inset) rounded-md flex min-w-0 cursor-pointer select-none items-center [[role=treeitem]:focus-visible>&]:ring-3 [[role=treeitem]:focus-visible>&]:ring-ring/50 hover:not-[[data-selected]]:bg-accent-hover ${DATA_DISABLED_CLASS}`,
    trigger:
      'opacity-70 inline-flex shrink-0 size-(--mo-tree-trigger) transition-transform items-center justify-center overflow-visible data-leaf:invisible data-expanded:rotate-90 data-loading:rotate-0 data-loading:animate-spin',
    icon: 'opacity-70 shrink-0 size-(--mo-tree-trigger)',
    label: 'flex-1 min-w-0 truncate',
    content: '',
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle',
    transition: false,
  },
  variants: {
    size: {
      sm: { row: 'text-xs gap-1.5 min-h-7', '--mo-tree-trigger': '0.875rem' },
      md: { row: 'text-sm gap-2 min-h-8', '--mo-tree-trigger': '1rem' },
      lg: { row: 'text-base gap-2.5 min-h-10', '--mo-tree-trigger': '1.25rem' },
    },
    transition: {
      true: {
        content:
          'h-(--mo-collapsible-content-height) overflow-hidden data-closed:(h-0 animate-accordion-up) data-expanded:animate-accordion-down motion-reduce:animate-none',
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
