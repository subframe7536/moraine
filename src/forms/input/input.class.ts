import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const inputRootVariants = cva(
  'rounded-md inline-flex w-full transition-[colors,box-shadow] items-center overflow-hidden focus-within:effect-fv-border data-invalid:effect-invalid data-disabled:effect-dis focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        xs: 'text-xs leading-4 h-6',
        sm: 'text-xs leading-4 h-7',
        md: 'text-sm leading-5 h-8',
        lg: 'text-sm leading-5 h-9',
        xl: 'text-base leading-6 h-10',
      },
      variant: INPUT_VARIANT,
    },
  },
)

export const inputInputVariants = cva(
  'style-placeholder text-foreground outline-none bg-transparent flex-1 h-full min-w-0 disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
      hasLeading: false,
      hasTrailing: false,
    },
    variants: {
      type: {
        file: 'text-muted-foreground file:(font-medium me-1.5 outline-none)',
      },
      size: {
        xs: 'leading-4 py-1',
        sm: 'leading-4 py-1.5',
        md: 'leading-5 py-1.5',
        lg: 'leading-5 py-2',
        xl: 'leading-6 py-2',
      },
      hasLeading: { true: '', false: '' },
      hasTrailing: { true: '', false: '' },
    },
    compoundVariants: [
      { size: 'xs', hasLeading: true, class: 'ps-1' },
      { size: 'sm', hasLeading: true, class: 'ps-1.5' },
      { size: 'md', hasLeading: true, class: 'ps-1.5' },
      { size: 'lg', hasLeading: true, class: 'ps-2' },
      { size: 'xl', hasLeading: true, class: 'ps-2' },
      { size: 'xs', hasLeading: false, class: 'ps-2' },
      { size: 'sm', hasLeading: false, class: 'ps-2.5' },
      { size: 'md', hasLeading: false, class: 'ps-2.5' },
      { size: 'lg', hasLeading: false, class: 'ps-3' },
      { size: 'xl', hasLeading: false, class: 'ps-3' },
      { size: 'xs', hasTrailing: true, class: 'pe-1' },
      { size: 'sm', hasTrailing: true, class: 'pe-1.5' },
      { size: 'md', hasTrailing: true, class: 'pe-1.5' },
      { size: 'lg', hasTrailing: true, class: 'pe-2' },
      { size: 'xl', hasTrailing: true, class: 'pe-2' },
      { size: 'xs', hasTrailing: false, class: 'pe-2' },
      { size: 'sm', hasTrailing: false, class: 'pe-2.5' },
      { size: 'md', hasTrailing: false, class: 'pe-2.5' },
      { size: 'lg', hasTrailing: false, class: 'pe-3' },
      { size: 'xl', hasTrailing: false, class: 'pe-3' },
    ],
  },
)

export const inputIconVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'size-4',
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-5',
      xl: 'size-6',
    },
  },
})
export const inputLeadingVariants = cva('text-muted-foreground flex shrink-0 items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'ps-2 gap-1',
      sm: 'ps-2.5 gap-1.5',
      md: 'ps-2.5 gap-1.5',
      lg: 'ps-3 gap-2',
      xl: 'ps-3 gap-2',
    },
  },
})

export const inputTrailingVariants = cva('text-muted-foreground flex shrink-0 items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'pe-2 gap-1',
      sm: 'pe-2.5 gap-1.5',
      md: 'pe-2.5 gap-1.5',
      lg: 'pe-3 gap-2',
      xl: 'pe-3 gap-2',
    },
  },
})

export type InputVariantProps = VariantProps<typeof inputRootVariants>
