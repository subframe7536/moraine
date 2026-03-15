import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const checkboxRootVariants = cva('flex items-start relative data-disabled:effect-dis', {
  defaultVariants: {
    indicator: 'start',
  },
  variants: {
    variant: {
      card: 'b-1 b-border rounded-lg data-checked:b-primary',
    },
    indicator: {
      start: 'flex-row',
      end: 'flex-row-reverse',
    },
  },
})

export const checkboxCardPaddingVariants = cva('p-3.5', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'p-2.5',
      sm: 'p-3',
      md: 'p-3.5',
      lg: 'p-4',
      xl: 'p-4.5',
    },
  },
})

export const checkboxContainerVariants = cva('flex items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'h-4',
      sm: 'h-4',
      md: 'h-5',
      lg: 'h-5',
      xl: 'h-6',
    },
  },
})

export const checkboxBaseVariants = cva(
  'outline-none b-(1 input) rounded-sm bg-background inline-flex transition-shadow items-center justify-center overflow-hidden bg-clip-padding peer-focus-visible:effect-fv-border data-checked:border-primary data-invalid:effect-invalid dark:bg-input/30',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'size-3',
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-4.5',
        xl: 'size-5',
      },
    },
  },
)

export const checkboxIconVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'size-2',
      sm: 'size-2.5',
      md: 'size-3',
      lg: 'size-3.5',
      xl: 'size-4',
    },
  },
})

export const checkboxWrapperVariants = cva('w-full', {
  defaultVariants: {
    indicator: 'start',
    size: 'md',
  },
  variants: {
    indicator: {
      start: 'ms-2',
      end: 'me-2',
      hidden: 'text-center',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
  },
})

export const checkboxLabelVariants = cva('text-foreground font-medium block', {
  variants: {
    required: {
      true: "after:(text-destructive ms-0.5 content-['*'])",
    },
  },
})

type CheckboxRootVariantProps = Omit<
  VariantProps<typeof checkboxRootVariants>,
  'variant' | 'indicator'
>

export type CheckboxVariantProps = CheckboxRootVariantProps &
  VariantProps<typeof checkboxContainerVariants> & {
    variant?: 'list' | 'card'
    indicator?: 'start' | 'end' | 'hidden'
  }
