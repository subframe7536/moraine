import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const switchTrackVariants = cva(
  'p-px outline-none border border-transparent rounded-full bg-input inline-flex shrink-0 cursor-pointer shadow-xs transition-[color,background-color,box-shadow] items-center focus-visible:effect-fv-border data-invalid:effect-invalid data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'h-4 w-7',
        md: 'h-4.5 w-8',
        lg: 'h-5.5 w-10',
      },
    },
  },
)

export const switchThumbVariants = cva(
  'rounded-full bg-background flex pointer-events-none shadow-sm transition-transform items-center justify-center relative',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'size-3 data-checked:translate-x-3',
        md: 'size-3.5 data-checked:translate-x-3.5',
        lg: 'size-4.5 data-checked:translate-x-4.5',
      },
    },
  },
)

export const switchWrapperVariants = cva('flex flex-col gap-0.5', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-xs ms-1.5',
      md: 'text-sm ms-2',
      lg: 'text-base ms-2.5',
    },
  },
})

export const SWITCH_ROOT_CLASS = 'flex flex-row'
export const SWITCH_THUMB_ICON_CLASS =
  'text-primary size-4/5 transition-opacity absolute data-unchecked:(text-muted-foreground opacity-90) data-checked:opacity-100 data-loading:effect-loading'
export const SWITCH_LABEL_CLASS =
  'text-foreground leading-tight font-medium block cursor-pointer select-none'

export type SwitchVariantProps = VariantProps<typeof switchTrackVariants>
