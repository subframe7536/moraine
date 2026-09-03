import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const TABS_LEADING_CLASS = 'inline-flex shrink-0 items-center justify-center'

export const tabsRecipe = recipe({
  slots: ['root', 'list', 'indicator', 'trigger', 'leading', 'label', 'trailing', 'content'],
  base: {
    root: 'flex gap-2',
    list: 'p-1 inline-flex items-center relative',
    indicator: 'rounded-md transition-[transform,width,height] absolute',
    trigger:
      'text-muted-foreground font-medium px-2 py-1.5 outline-none inline-flex gap-1.5 min-w-0 cursor-pointer transition-colors items-center justify-center relative hover:text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-64 disabled:pointer-events-none',
    leading: TABS_LEADING_CLASS,
    label: '',
    trailing: '',
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
      orientation: 'horizontal',
      variant: 'pill',
      class: {
        indicator: 'inset-y-1',
      },
    },
    {
      orientation: 'vertical',
      variant: 'pill',
      class: {
        indicator: 'inset-x-1',
      },
    },
    {
      orientation: 'horizontal',
      variant: 'link',
      class: {
        indicator: 'bottom-0 h-px rounded-full',
      },
    },
    {
      orientation: 'vertical',
      variant: 'link',
      class: {
        indicator: 'right-0 w-px rounded-full',
      },
    },
  ],
})

export type TabsVariantProps = VariantProps<typeof tabsRecipe>
