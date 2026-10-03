import { defineRecipe } from '../../theme/recipe'
import { DISABLED_CLASS, FOCUS_VISIBLE_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { TabsStyleSlot, TabsStyleVariant } from './tabs.style-types'

export const tabsDataAttributes = {
  root: createDataAttributes('disabled'),
  trigger: createDataAttributes('disabled', 'highlighted', 'selected'),
  content: createDataAttributes('selected'),
} satisfies DataAttributeContract<keyof TabsStyleSlot>

export const tabsRecipe = /* @__PURE__ */ defineRecipe<TabsStyleSlot, TabsStyleVariant>('tabs', {
  base: {
    root: '',
    list: 'p-1 inline-flex items-center relative',
    indicator: 'rounded-md transition-transform absolute',
    trigger: `text-muted-foreground rounded-md font-medium px-2 py-1.5 outline-none inline-flex gap-1.5 min-w-0 cursor-pointer transition-colors items-center justify-center relative hover:text-foreground ${FOCUS_VISIBLE_CLASS} ${DISABLED_CLASS}`,
    leading: 'inline-flex shrink-0 items-center justify-center',
    label: 'truncate',
    content: 'text-sm outline-none w-full',
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'pill',
    size: 'md',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-col w-full',
        list: 'w-full',
        indicator: 'left-0',
        trigger: 'flex-1',
      },
      vertical: {
        root: 'flex-row',
        list: 'flex-col h-fit',
        indicator: 'top-0',
        trigger: 'w-full justify-start',
      },
    },
    variant: {
      pill: {
        list: 'rounded-lg bg-muted',
        indicator: 'border border-border bg-background shadow-surface',
      },
      link: {
        list: 'rounded-none bg-transparent',
        indicator: 'bg-primary',
        trigger: 'data-selected:text-primary hover:data-highlighted:not-disabled:text-foreground',
      },
    },
    size: {
      sm: {
        trigger: 'text-xs',
      },
      md: {
        trigger: 'text-sm',
      },
      lg: {
        trigger: 'text-base',
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'pill', orientation: 'horizontal' },
      indicator: 'inset-y-1',
    },
    {
      variants: { variant: 'pill', orientation: 'vertical' },
      indicator: 'inset-x-1',
    },
    {
      variants: { variant: 'link', orientation: 'horizontal' },
      indicator: 'bottom-0 h-px rounded-full',
    },
    {
      variants: { variant: 'link', orientation: 'vertical' },
      indicator: 'right-0 w-px rounded-full',
    },
  ],
})
