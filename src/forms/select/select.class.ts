import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const selectControlVariants = cva(
  'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:effect-invalid data-disabled:effect-dis data-invalid:ring-3 focus-visible:ring-3',
  {
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
    variants: {
      variant: INPUT_VARIANT,
      size: {
        xs: 'text-xs pe-1.5 ps-1.5',
        sm: 'text-xs pe-1.5 ps-2',
        md: 'text-sm pe-2 ps-2.5',
        lg: 'text-sm pe-2.5 ps-3',
        xl: 'text-base pe-3 ps-3.5',
      },
      search: {
        true: 'cursor-text focus-within:effect-fv-border focus-within:data-invalid:effect-invalid',
        false:
          'cursor-pointer focus-visible:effect-fv-border focus-visible:data-invalid:effect-invalid',
      },
    },
  },
)

export const selectInputVariants = cva(
  'outline-none bg-transparent flex-1 min-w-0 w-full disabled:effect-dis',
  {
    defaultVariants: {
      mode: 'single',
      size: 'md',
    },
    variants: {
      mode: {
        single: 'py-1.5',
        multi: 'leading-$s-m min-w-12',
      },
      size: {
        xs: 'text-xs var-select-0.5',
        sm: 'text-xs var-select-1',
        md: 'text-sm var-select-1',
        lg: 'text-sm var-select-1.5',
        xl: 'text-base var-select-1.5',
      },
    },
  },
)

export const selectTriggerIconVariants = cva(
  'text-muted-foreground outline-none opacity-80 shrink-0 pointer-events-none',
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

export const selectLeadingIconVariants = cva('text-muted-foreground shrink-0', {
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
})

export const SELECT_CLEAR_ACTION_CLASS =
  'transition-colors hover:bg-muted-hover active:bg-muted-active'

export const selectItemVariants = cva(
  'px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs min-h-6',
        sm: 'text-xs min-h-7',
        md: 'text-sm min-h-8',
        lg: 'text-sm min-h-9',
        xl: 'text-base min-h-10',
      },
    },
  },
)

export const selectContentVariants = cva(
  'text-popover-foreground p-0 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-$mo-popper-content-transform-origin duration-100 z-50 data-closed:animate-menu-out data-expanded:animate-menu-in',
  {
    defaultVariants: {
      side: 'right',
    },
    variants: {
      side: {
        top: 'mb-$mo-popper-content-overflow-padding animate-menu-side-top',
        right: 'ml-$mo-popper-content-overflow-padding animate-menu-side-right',
        bottom: 'mt-$mo-popper-content-overflow-padding animate-menu-side-bottom',
        left: 'mr-$mo-popper-content-overflow-padding animate-menu-side-left',
      },
    },
  },
)

export type SelectControlVariantProps = VariantProps<typeof selectControlVariants> &
  VariantProps<typeof selectTriggerIconVariants>
