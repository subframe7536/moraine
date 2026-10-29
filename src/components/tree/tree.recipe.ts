import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { CHECKBOX_CONTROL_CLASS, CHECKBOX_ICON_CLASS } from '../checkbox/checkbox.recipe'

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
  checkbox: /* @__PURE__ */ createDataAttributes(
    'checked',
    'disabled',
    'indeterminate',
    'unchecked',
  ),
  content: /* @__PURE__ */ createDataAttributes('closed', 'expanded', 'settled'),
} satisfies DataAttributeContract<keyof TreeStyleSlot>

/** Resets list styling on the `tree` root and nested `group` lists. */
export const TREE_LIST_CLASS = 'm-0 p-0 list-none'

/** Keeps the chevron pointing toward the content direction in right-to-left layouts. */
export const TREE_TRIGGER_ICON_CLASS = 'rtl:-scale-x-100'

export const TREE_ITEM_INDENT_GUIDE_STYLE = {
  '--mo-tree-guide':
    'repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px var(--mo-tree-indent)) calc(var(--mo-tree-gutter) + var(--mo-tree-pad) + 0.5rem) 0 / calc(var(--mo-tree-level) * var(--mo-tree-indent)) 100% no-repeat',
}

export const TREE_ROW_PADDING_STYLE = {
  '--mo-tree-pad-start': 'calc(var(--mo-tree-pad) + var(--mo-tree-level) * var(--mo-tree-indent))',
}

/**
 * Geometry variables live on the root so `tree.Tree` `style` overrides reach every item. Items
 * only declare `--mo-tree-level`, which per-item classes combine with the inherited values.
 */
export const treeRecipe = /* @__PURE__ */ defineRecipe<TreeStyleSlot, TreeStyleVariants>('tree', {
  base: {
    '--mo-tree-indent': '1.25rem',
    '--mo-tree-gutter': '0.25rem',
    '--mo-tree-pad': '0.5rem',
    root: `text-foreground min-h-0 w-full relative ${TREE_LIST_CLASS}`,
    item: 'outline-none relative focus-visible:z-1',
    row: `mx-(--mo-tree-gutter) pe-2 ps-(--mo-tree-pad-start) rounded-md flex gap-(--mo-tree-gap) min-w-0 cursor-pointer select-none items-center relative hover:bg-muted [[role=treeitem]:focus-visible>&]:ring-3 [[role=treeitem]:focus-visible>&]:ring-ring/50 [[role=treeitem]:focus-visible>&]:z-1 ${DATA_DISABLED_CLASS}`,
    trigger:
      'text-inherit opacity-70 inline-flex shrink-0 transition-transform items-center justify-center overflow-visible data-leaf:invisible data-expanded:rotate-90 data-loading:rotate-0 data-loading:animate-spin',
    icon: 'text-inherit opacity-70 shrink-0',
    checkbox: `${CHECKBOX_CONTROL_CLASS} data-indeterminate:(border-primary bg-primary)`,
    checkboxIcon: `${CHECKBOX_ICON_CLASS} text-primary-foreground`,
    label: 'flex-1 min-w-0 truncate',
    content: '',
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle',
    transition: false,
    indentGuide: true,
  },
  variants: {
    size: {
      sm: { row: 'text-xs py-1', checkbox: 'size-3.5', '--mo-tree-gap': '0.375rem' },
      md: { row: 'text-sm py-1.5', checkbox: 'size-4', '--mo-tree-gap': '0.5rem' },
      lg: {
        row: 'text-base py-2',
        checkbox: 'size-4.5',
        '--mo-tree-gap': '0.625rem',
      },
    },
    indentGuide: {
      true: {
        item: '[background:var(--mo-tree-guide)]',
      },
    },
    transition: {
      true: {
        content:
          'h-(--mo-collapsible-content-height) overflow-hidden data-closed:(h-0 animate-accordion-up) data-expanded:animate-accordion-down motion-reduce:animate-none data-expanded:data-settled:overflow-visible motion-reduce:data-expanded:overflow-visible',
      },
    },
    variant: {
      subtle: {
        row: 'data-selected:(text-accent-foreground bg-accent active:bg-accent-active hover:bg-accent-hover)',
      },
      solid: {
        row: 'data-selected:(text-primary-foreground bg-primary active:bg-primary-active hover:bg-primary-hover)',
      },
    },
  },
})
