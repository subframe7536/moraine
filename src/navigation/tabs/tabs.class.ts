import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const tabsRootVariants = cva('flex gap-2', {
  variants: {
    orientation: {
      horizontal: 'flex-col w-full',
      vertical: 'flex-row',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})

export const tabsListVariants = cva('p-1 inline-flex items-center relative', {
  variants: {
    variant: {
      pill: 'rounded-lg bg-muted',
      link: 'rounded-none bg-transparent',
    },
    orientation: {
      horizontal: 'w-full',
      vertical: 'flex-col h-fit',
    },
  },
  defaultVariants: {
    variant: 'pill',
    orientation: 'horizontal',
  },
})

export const tabsIndicatorVariants = cva(
  'rounded-md transition-[transform,width,height] absolute',
  {
    variants: {
      orientation: {
        horizontal: 'left-0',
        vertical: 'top-0',
      },
      variant: {
        pill: 'border border-border bg-background shadow-xs',
        link: 'bg-primary',
      },
    },
    compoundVariants: [
      {
        orientation: 'horizontal',
        variant: 'pill',
        class: 'inset-y-1',
      },
      {
        orientation: 'vertical',
        variant: 'pill',
        class: 'inset-x-1',
      },
      {
        orientation: 'horizontal',
        variant: 'link',
        class: 'bottom-0 h-px rounded-full',
      },
      {
        orientation: 'vertical',
        variant: 'link',
        class: 'right-0 w-px rounded-full',
      },
    ],
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'pill',
    },
  },
)

export const tabsTriggerVariants = cva(
  'text-muted-foreground font-medium px-2 py-1.5 outline-none inline-flex gap-1.5 min-w-0 cursor-pointer transition-colors items-center justify-center relative hover:text-foreground focus-visible:effect-fv-border focus-visible:border-ring disabled:effect-dis focus-visible:ring-3 focus-visible:ring-ring/50',
  {
    variants: {
      orientation: {
        horizontal: 'flex-1',
        vertical: 'w-full justify-start',
      },
      variant: {
        pill: '',
        link: 'data-selected:text-primary hover:data-highlighted:not-disabled:text-foreground',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'pill',
      size: 'md',
    },
  },
)

export const TABS_LEADING_CLASS = 'inline-flex shrink-0 items-center justify-center'

export type TabsVariantProps = VariantProps<typeof tabsTriggerVariants>
