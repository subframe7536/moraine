import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const avatarRootVariants = cva(
  'relative inline-flex shrink-0 select-none items-center justify-center overflow-visible rounded-full bg-muted text-muted-foreground ring-1 ring-border',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'size-7 text-xs',
        md: 'size-8 text-sm',
        lg: 'size-10 text-base',
      },
    },
  },
)

export const avatarImageVariants = cva(
  'absolute inset-0 size-full rounded-[inherit] object-cover transition-opacity ease-out',
  {
    defaultVariants: {
      status: 'idle',
      transition: 'normal',
    },
    variants: {
      status: {
        idle: 'opacity-0 hidden-hitless',
        loading: 'opacity-0 hidden-hitless',
        loaded: 'opacity-100',
        error: 'opacity-0 hidden-hitless',
      },
      transition: {
        none: 'duration-0',
        fast: 'duration-150',
        normal: 'duration-300',
        slow: 'duration-500',
      },
    },
  },
)

export const avatarFallbackVariants = cva(
  'absolute inset-0 flex items-center justify-center rounded-[inherit] font-medium uppercase transition-opacity ease-out',
  {
    defaultVariants: {
      size: 'md',
      status: 'idle',
      transition: 'normal',
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
        loaded: 'opacity-0 hidden-hitless',
        error: 'opacity-100',
      },
      transition: {
        none: 'duration-0',
        fast: 'duration-150',
        normal: 'duration-300',
        slow: 'duration-500',
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
  'absolute z-10 inline-flex items-center justify-center rounded-full bg-background text-foreground ring-2 ring-background',
  {
    defaultVariants: {
      size: 'md',
      badgePosition: 'bottom-right',
    },
    variants: {
      size: {
        sm: 'size-3 text-[9px]',
        md: 'size-3.5 text-[10px]',
        lg: 'size-4 text-xs',
      },
      badgePosition: {
        'top-left': '-top-0.5 -left-0.5',
        'top-right': '-top-0.5 -right-0.5',
        'bottom-left': '-bottom-0.5 -left-0.5',
        'bottom-right': '-bottom-0.5 -right-0.5',
      },
    },
  },
)

export const avatarGroupItemVariants = cva('relative rounded-full ring-background first:me-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'ring-2 -me-1.5',
      md: 'ring-2 -me-1.5',
      lg: 'ring-2 -me-1.5',
    },
  },
})

export const avatarGroupCountVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ring-background first:me-0',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'size-7 text-xs ring-2 -me-1.5',
        md: 'size-8 text-sm ring-2 -me-1.5',
        lg: 'size-10 text-base ring-2 -me-1.5',
      },
    },
  },
)

export type AvatarVariantProps = VariantProps<typeof avatarRootVariants> &
  VariantProps<typeof avatarImageVariants> &
  VariantProps<typeof avatarFallbackVariants> &
  VariantProps<typeof avatarFallbackIconVariants> &
  VariantProps<typeof avatarBadgeVariants> &
  VariantProps<typeof avatarGroupItemVariants> &
  VariantProps<typeof avatarGroupCountVariants>

export type AvatarSize = Exclude<AvatarVariantProps['size'], undefined>
export type AvatarTransition = Exclude<AvatarVariantProps['transition'], undefined>
export type AvatarBadgePosition = Exclude<AvatarVariantProps['badgePosition'], undefined>
