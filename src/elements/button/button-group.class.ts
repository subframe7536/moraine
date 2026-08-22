import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const buttonGroupVariants = cva(
  'inline-flex w-fit items-stretch *:focus-visible:(relative z-sticky)',
  {
    defaultVariants: {
      orientation: 'horizontal',
    },
    variants: {
      orientation: {
        horizontal:
          'flex-row [&>[data-slot=separator]]:mx-px [&>*:not(:first-child)]:(border-s-0 rounded-s-none) [&>*:not(:last-child)]:rounded-e-none',
        vertical:
          'flex-col [&>[data-slot=separator]]:my-px [&>*:not(:first-child)]:(border-t-0 rounded-t-none) [&>*:not(:last-child)]:rounded-b-none',
      },
    },
  },
)

export type ButtonGroupLayoutVariantProps = VariantProps<typeof buttonGroupVariants>
