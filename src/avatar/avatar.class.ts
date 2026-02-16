import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const avatarRootVariants = cva(
  'inline-flex items-center justify-center shrink-0 select-none rounded-full align-middle bg-background',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        '3xs': 'size-4 text-[8px]',
        '2xs': 'size-5 text-[10px]',
        xs: 'size-6 text-xs',
        sm: 'size-7 text-sm',
        md: 'size-8 text-base',
        lg: 'size-9 text-lg',
        xl: 'size-10 text-xl',
        '2xl': 'size-11 text-[22px]',
        '3xl': 'size-12 text-2xl',
      },
    },
  },
)

export const avatarImageVariants = cva('h-full w-full rounded-[inherit] object-cover')

export const avatarFallbackVariants = cva('font-medium leading-none text-muted-foreground truncate')

export const avatarIconVariants = cva('text-muted-foreground shrink-0')

export type AvatarVariantProps = VariantProps<typeof avatarRootVariants>
