import { cva } from 'cls-variant'
import type { VariantProps } from 'cls-variant'

export const iconSizeVariants = cva('shrink-0', {
  variants: {
    size: {
      xs: 'size-3.5',
      sm: 'size-4',
      md: 'size-4.5',
      lg: 'size-5',
      xl: 'size-5.5',
    },
  },
})

export type IconSizeProps = VariantProps<typeof iconSizeVariants>
