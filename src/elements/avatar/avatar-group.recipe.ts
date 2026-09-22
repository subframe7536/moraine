import { defineRecipe } from '../../theme/style/recipe.ts'

import type { AvatarGroupStyleSlot, AvatarGroupStyleVariant } from './avatar-group.style-types.ts'
import { avatarDataAttributes } from './avatar.recipe.ts'

export const avatarGroupDataAttributes = {
  item: avatarDataAttributes.root,
  image: avatarDataAttributes.image,
  fallback: avatarDataAttributes.fallback,
}

export const avatarGroupRecipe = /* @__PURE__ */ defineRecipe<
  AvatarGroupStyleSlot,
  AvatarGroupStyleVariant
>('avatarGroup', {
  base: {
    root: 'inline-flex flex-row-reverse justify-end',
    item: 'rounded-full ring-background relative first:me-0',
    count:
      'text-muted-foreground font-medium rounded-full bg-muted inline-flex shrink-0 ring-background items-center justify-center first:me-0',
    image: '',
    fallback: '',
    fallbackIcon: '',
    badge: '',
  },
  defaultVariants: { size: 'md' },
  variants: {
    size: {
      sm: { item: 'ring-2 -me-2', count: 'text-xs size-6 ring-2 -me-2' },
      md: { item: 'ring-2 -me-2', count: 'text-sm size-8 ring-2 -me-2' },
      lg: { item: 'ring-2 -me-2', count: 'text-base size-10 ring-2 -me-2' },
    },
  },
})
