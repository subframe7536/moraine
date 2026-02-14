import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const avatarGroupRootVariants = cva('inline-flex flex-row-reverse justify-end')

export const avatarGroupBaseVariants = cva('relative rounded-full ring-background first:me-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      '3xs': 'ring -me-0.5',
      '2xs': 'ring -me-0.5',
      xs: 'ring -me-0.5',
      sm: 'ring-2 -me-1.5',
      md: 'ring-2 -me-1.5',
      lg: 'ring-2 -me-1.5',
      xl: 'ring-3 -me-2',
      '2xl': 'ring-3 -me-2',
      '3xl': 'ring-3 -me-2',
    },
  },
})

export type AvatarGroupVariantProps = VariantProps<typeof avatarGroupBaseVariants>
