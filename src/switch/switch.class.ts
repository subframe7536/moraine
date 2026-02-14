import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const switchRootVariants = cva('relative flex items-start', {
  variants: {
    disabled: {
      true: 'opacity-75',
    },
  },
})

export const switchContainerVariants = cva('flex items-center', {
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

export const switchBaseVariants = cva(
  'inline-flex shrink-0 items-center rounded-full border-2 border-transparent p-px outline-none transition-colors data-[checked]:bg-primary bg-input focus-visible:effect-fv',
  {
    defaultVariants: {
      color: 'primary',
      size: 'md',
      disabled: false,
    },
    variants: {
      color: {
        primary: 'data-[checked]:bg-primary',
        secondary: 'data-[checked]:bg-secondary',
        neutral: 'data-[checked]:bg-neutral',
        error: 'data-[checked]:bg-destructive',
      },
      size: {
        xs: 'w-7',
        sm: 'w-8',
        md: 'w-9',
        lg: 'w-10',
        xl: 'w-11',
      },
      disabled: {
        true: 'cursor-not-allowed',
      },
    },
  },
)

export const switchThumbVariants = cva(
  'pointer-events-none relative flex items-center justify-center rounded-full bg-background shadow-sm transition-transform',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'size-3 data-[checked]:translate-x-3',
        sm: 'size-3.5 data-[checked]:translate-x-3.5',
        md: 'size-4 data-[checked]:translate-x-4',
        lg: 'size-4.5 data-[checked]:translate-x-4.5',
        xl: 'size-5 data-[checked]:translate-x-5',
      },
    },
  },
)

export const switchIconVariants = cva('absolute size-10/12 shrink-0 transition-opacity', {
  defaultVariants: {
    color: 'primary',
  },
  variants: {
    color: {
      primary: 'text-primary',
      secondary: 'text-secondary',
      neutral: 'text-foreground',
      error: 'text-destructive',
    },
    checked: {
      true: 'opacity-100',
    },
    unchecked: {
      true: 'opacity-100 text-muted-foreground',
    },
    loading: {
      true: 'opacity-100 animate-spin',
    },
  },
})

export const switchWrapperVariants = cva('ms-2', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
  },
})

export const switchLabelVariants = cva('block font-medium text-foreground', {
  variants: {
    required: {
      true: "after:(ms-0.5 text-destructive) after:content-['*']",
    },
    disabled: {
      true: 'cursor-not-allowed',
    },
  },
})

export const switchDescriptionVariants = cva('text-muted-foreground', {
  variants: {
    disabled: {
      true: 'cursor-not-allowed',
    },
  },
})

export type SwitchVariantProps = VariantProps<typeof switchContainerVariants> &
  VariantProps<typeof switchBaseVariants> &
  VariantProps<typeof switchThumbVariants> &
  VariantProps<typeof switchIconVariants>
