import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const AVATAR_IMAGE_CLASS =
  'rounded-full size-full transition-opacity inset-0 absolute object-cover'

export const avatarRecipe = recipe({
  slots: ['root', 'image', 'fallback', 'fallbackIcon', 'badge'],
  base: {
    root: "text-muted-foreground rounded-full bg-muted inline-flex shrink-0 select-none items-center justify-center relative overflow-visible after:border after:border-border after:rounded-full after:pointer-events-none after:content-[''] after:inset-0 after:absolute dark:after:mix-blend-lighten",
    image: AVATAR_IMAGE_CLASS,
    fallback:
      'text-muted-foreground font-medium rounded-full bg-muted flex uppercase transition-opacity items-center inset-0 justify-center absolute',
    fallbackIcon: 'shrink-0',
    badge:
      'text-foreground rounded-full bg-background inline-flex pointer-events-none ring-2 ring-background items-center justify-center absolute z-sticky',
  },
  defaultVariants: {
    size: 'md',
    badgePosition: 'bottom-right',
    status: 'idle',
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs size-6',
        fallback: 'text-xs',
        fallbackIcon: 'text-sm',
        badge: 'text-[9px] size-3',
      },
      md: {
        root: 'text-sm size-8',
        fallback: 'text-sm',
        fallbackIcon: 'text-base',
        badge: 'text-[10px] size-3.5',
      },
      lg: {
        root: 'text-base size-10',
        fallback: 'text-base',
        fallbackIcon: 'text-lg',
        badge: 'text-xs size-4',
      },
    },
    badgePosition: {
      'top-left': { badge: '-left-0.5 -top-0.5' },
      'top-right': { badge: '-right-0.5 -top-0.5' },
      'bottom-left': { badge: '-bottom-0.5 -left-0.5' },
      'bottom-right': { badge: '-bottom-0.5 -right-0.5' },
    },
    status: {
      idle: { fallback: 'opacity-100' },
      loading: { fallback: 'opacity-100' },
      loaded: { fallback: 'opacity-0 pointer-events-none' },
      error: { fallback: 'opacity-100' },
    },
  },
})

export const avatarGroupRecipe = recipe({
  slots: ['root', 'item', 'count'],
  base: {
    root: 'inline-flex flex-row-reverse justify-end',
    item: 'rounded-full ring-background relative first:me-0',
    count:
      'text-muted-foreground font-medium rounded-full bg-muted inline-flex shrink-0 ring-background items-center justify-center first:me-0',
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: {
        item: 'ring-2 -me-2',
        count: 'text-xs size-6 ring-2 -me-2',
      },
      md: {
        item: 'ring-2 -me-2',
        count: 'text-sm size-8 ring-2 -me-2',
      },
      lg: {
        item: 'ring-2 -me-2',
        count: 'text-base size-10 ring-2 -me-2',
      },
    },
  },
})

export const avatarRootVariants = recipe({
  base: "text-muted-foreground rounded-full bg-muted inline-flex shrink-0 select-none items-center justify-center relative overflow-visible after:border after:border-border after:rounded-full after:pointer-events-none after:content-[''] after:inset-0 after:absolute dark:after:mix-blend-lighten",
  defaultVariants: { size: 'md' },
  variants: {
    size: {
      sm: 'text-xs size-6',
      md: 'text-sm size-8',
      lg: 'text-base size-10',
    },
  },
})

export const avatarFallbackVariants = recipe({
  base: 'text-muted-foreground font-medium rounded-full bg-muted flex uppercase transition-opacity items-center inset-0 justify-center absolute',
  defaultVariants: { size: 'md', status: 'idle' },
  variants: {
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
    status: {
      idle: 'opacity-100',
      loading: 'opacity-100',
      loaded: 'opacity-0 pointer-events-none',
      error: 'opacity-100',
    },
  },
})

export const avatarFallbackIconVariants = recipe({
  base: 'shrink-0',
  defaultVariants: { size: 'md' },
  variants: {
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  },
})

export const avatarBadgeVariants = recipe({
  base: 'text-foreground rounded-full bg-background inline-flex pointer-events-none ring-2 ring-background items-center justify-center absolute z-sticky',
  defaultVariants: { size: 'md', badgePosition: 'bottom-right' },
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
})

export const avatarGroupItemVariants = recipe({
  base: 'rounded-full ring-background relative first:me-0',
  defaultVariants: { size: 'md' },
  variants: {
    size: {
      sm: 'ring-2 -me-2',
      md: 'ring-2 -me-2',
      lg: 'ring-2 -me-2',
    },
  },
})

export const avatarGroupCountVariants = recipe({
  base: 'text-muted-foreground font-medium rounded-full bg-muted inline-flex shrink-0 ring-background items-center justify-center first:me-0',
  defaultVariants: { size: 'md' },
  variants: {
    size: {
      sm: 'text-xs size-6 ring-2 -me-2',
      md: 'text-sm size-8 ring-2 -me-2',
      lg: 'text-base size-10 ring-2 -me-2',
    },
  },
})

export type AvatarVariantProps = VariantProps<typeof avatarRecipe>
export type AvatarGroupVariantProps = VariantProps<typeof avatarGroupRecipe>
