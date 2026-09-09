import { slotRecipe } from '../../shared/style/recipe.ts'

import type { TabsT } from './tabs.types.ts'

export const tabsRecipe = /* @__PURE__ */ slotRecipe<TabsT.Slot, TabsT.Variant>({
  base: {
    root: 'flex gap-2',
    list: 'p-1 inline-flex items-center relative',
    indicator: 'rounded-md transition-transform absolute',
    trigger:
      'text-muted-foreground rounded-md font-medium px-2 py-1.5 outline-none inline-flex gap-1.5 min-w-0 cursor-pointer transition-colors items-center justify-center relative hover:text-foreground focus-visible:(outline-none border-ring ring-3 ring-ring/50) disabled:(opacity-64 pointer-events-none)',
    leading: 'inline-flex shrink-0 items-center justify-center',
    label: 'truncate',
    trailing: '',
    content: 'text-sm outline-none w-full',
  },
  defaults: {
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
        indicator: 'border border-border bg-background shadow-xs',
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
      class: { indicator: 'inset-y-1' },
    },
    {
      variants: { variant: 'pill', orientation: 'vertical' },
      class: { indicator: 'inset-x-1' },
    },
    {
      variants: { variant: 'link', orientation: 'horizontal' },
      class: { indicator: 'bottom-0 h-px rounded-full' },
    },
    {
      variants: { variant: 'link', orientation: 'vertical' },
      class: { indicator: 'right-0 w-px rounded-full' },
    },
  ],
})
