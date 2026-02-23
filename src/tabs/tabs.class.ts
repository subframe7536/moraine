import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const tabsRootVariants = cva('flex gap-2', {
  variants: {
    orientation: {
      horizontal: 'w-full flex-col',
      vertical: 'flex-row',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})

export const tabsListVariants = cva('relative inline-flex items-center p-1', {
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

export const tabsIndicatorVariants = cva('absolute rounded-md transition-all duration-200', {
  variants: {
    orientation: {
      horizontal: 'left-0 w-$kb-tabs-indicator-size translate-x-$kb-tabs-indicator-position',
      vertical: 'top-0 h-$kb-tabs-indicator-size translate-y-$kb-tabs-indicator-position',
    },
    variant: {
      pill: 'inset-y-1 bg-background shadow-xs',
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
  'group relative inline-flex min-w-0 items-center justify-center gap-1.5 rounded-md font-medium text-muted outline-none disabled:(cursor-not-allowed opacity-50) data-selected:(text-foreground) focus-visible:(border-ring ring-3 ring-ring/50)',
  {
    variants: {
      orientation: {
        horizontal: 'flex-1',
        vertical: 'w-full justify-start',
      },
      variant: {
        pill: '',
        link: 'rounded-none bg-transparent data-selected:(text-primary)',
      },
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-3 py-2 text-sm',
        xl: 'px-3 py-2 text-base',
      },
      color: {
        primary: '',
        neutral: '',
        secondary: 'data-selected:(text-secondary)',
        error: 'data-selected:(text-destructive)',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'pill',
      size: 'md',
      color: 'primary',
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

export type TabsVariantProps = VariantProps<typeof tabsRootVariants> &
  VariantProps<typeof tabsListVariants> &
  VariantProps<typeof tabsIndicatorVariants> &
  VariantProps<typeof tabsTriggerVariants> &
  VariantProps<typeof tabsLeadingVariants>
