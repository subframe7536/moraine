import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { SURFACE_INVALID_VARIANT, TEXT_SIZE_VARIANT } from '../../shared/cva-common.class'

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
  'inline-flex shrink-0 items-center rounded-full border border-transparent bg-input p-px outline-none transition-[color,box-shadow] dark:bg-input/80 peer-focus-visible:effect-fv-border data-checked:bg-primary',
  {
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
    variants: {
      size: {
        xs: 'w-7',
        sm: 'w-8',
        md: 'w-9',
        lg: 'w-10',
        xl: 'w-11',
      },
      invalid: SURFACE_INVALID_VARIANT,
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
        xs: 'size-3 data-checked:translate-x-3',
        sm: 'size-3.5 data-checked:translate-x-3.5',
        md: 'size-4 data-checked:translate-x-4',
        lg: 'size-4.5 data-checked:translate-x-4.5',
        xl: 'size-5 data-checked:translate-x-5',
      },
    },
  },
)

export const switchIconVariants = cva('absolute size-10/12 transition-opacity text-primary', {
  variants: {
    checked: {
      true: 'opacity-100',
    },
    unchecked: {
      true: 'opacity-90 text-muted-foreground',
    },
    loading: {
      true: 'opacity-80 animate-spin',
    },
  },
})

export const switchWrapperVariants = cva('ms-2', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
  },
})

export type SwitchVariantProps = VariantProps<typeof switchContainerVariants>
