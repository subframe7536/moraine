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
      link: 'bg-transparent',
    },
    orientation: {
      horizontal: 'w-full',
      vertical: 'flex-col',
    },
  },
  defaultVariants: {
    variant: 'pill',
    orientation: 'horizontal',
  },
})

export const tabsIndicatorVariants = cva('rounded-md transition-all duration-200 absolute', {
  variants: {
    orientation: {
      horizontal: 'w-$kb-tabs-indicator-size translate-x-$kb-tabs-indicator-position left-0',
      vertical: 'h-$kb-tabs-indicator-size translate-y-$kb-tabs-indicator-position top-0',
    },
    variant: {
      pill: 'bg-background shadow-xs inset-y-1',
      link: 'bg-primary',
    },
  },
  compoundVariants: [
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
})

export const tabsTriggerVariants = cva(
  'text-muted-foreground font-medium outline-none inline-flex gap-1.5 min-w-0 cursor-pointer transition items-center justify-center relative focus-visible:effect-fv-border disabled:effect-dis',
  {
    variants: {
      orientation: {
        horizontal: 'flex-1',
        vertical: 'w-full justify-start',
      },
      variant: {
        pill: 'rounded-md data-selected:text-foreground',
        link: 'data-selected:text-primary',
      },
      size: {
        xs: 'text-xs px-1',
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-2.5 py-1.5',
        lg: 'text-sm px-3 py-2',
        xl: 'text-base px-4 py-2',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'pill',
      size: 'md',
    },
  },
)

export const tabsLeadingVariants = cva('inline-flex shrink-0 items-center justify-center', {
  variants: {
    size: {
      xs: 'text-sm',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-base',
      xl: 'text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export type TabsVariantProps = VariantProps<typeof tabsTriggerVariants>
