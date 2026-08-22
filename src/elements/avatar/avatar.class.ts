import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const avatarRootVariants = cva(
  'text-muted-foreground rounded-full bg-muted inline-flex shrink-0 select-none items-center justify-center relative overflow-visible after:(border border-border rounded-full pointer-events-none content-empty inset-0 absolute) dark:after:mix-blend-lighten',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'text-xs size-6',
        md: 'text-sm size-8',
        lg: 'text-base size-10',
      },
    },
  },
)

export const AVATAR_IMAGE_CLASS =
  'rounded-full size-full transition-opacity inset-0 absolute object-cover'

export const avatarFallbackVariants = cva(
  'text-muted-foreground font-medium rounded-full bg-muted flex uppercase transition-opacity items-center inset-0 justify-center absolute',
  {
    defaultVariants: {
      size: 'md',
      status: 'idle',
    },
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      status: {
        idle: 'opacity-100',
        loading: 'opacity-100',
        loaded: 'hidden-hitless opacity-0',
        error: 'opacity-100',
      },
    },
  },
)

export const avatarFallbackIconVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
})

export const avatarBadgeVariants = cva(
  'text-foreground rounded-full bg-background inline-flex pointer-events-none ring-2 ring-background items-center justify-center absolute z-sticky',
  {
    defaultVariants: {
      size: 'md',
      badgePosition: 'bottom-right',
    },
    variants: {
      size: {
        sm: 'text-[9px] size-3',
        md: 'text-[10px] size-3.5',
        lg: 'text-xs size-4',
      },
      badgePosition: {
        'top-left': '-left-0.5 -top-0.5',
        'top-right': '-right-0.5 -top-0.5',
        'bottom-left': '-bottom-0.5 -left-0.5',
        'bottom-right': '-bottom-0.5 -right-0.5',
      },
    },
  },
)

export const avatarGroupItemVariants = cva('rounded-full ring-background relative first:me-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'ring-2 -me-2',
      md: 'ring-2 -me-2',
      lg: 'ring-2 -me-2',
    },
  },
})

export const avatarGroupCountVariants = cva(
  'text-muted-foreground font-medium rounded-full bg-muted inline-flex shrink-0 ring-background items-center justify-center first:me-0',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'text-xs size-6 ring-2 -me-2',
        md: 'text-sm size-8 ring-2 -me-2',
        lg: 'text-base size-10 ring-2 -me-2',
      },
    },
  },
)

export type AvatarVariantProps = VariantProps<typeof avatarRootVariants> &
  VariantProps<typeof avatarBadgeVariants>
export type AvatarGroupVariantProps = VariantProps<typeof avatarRootVariants>
