import { defineRecipe } from '../../theme/recipe'
import {
  PEER_FOCUS_CLASS,
  PEER_INVALID_CLASS,
  INPUT_VARIANT,
} from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { InputGroupStyleSlot, InputGroupRecipeVariant } from './input-group.style-types'

export const inputGroupDataAttributes = {
  root: createDataAttributes('input-group', 'orientation'),
  leading: createDataAttributes('compact', 'orientation'),
  trailing: createDataAttributes('compact', 'orientation'),
} satisfies DataAttributeContract<keyof InputGroupStyleSlot>

export const inputGroupRecipe = /* @__PURE__ */ defineRecipe<
  InputGroupStyleSlot,
  InputGroupRecipeVariant
>('inputGroup', {
  base: {
    root: 'flex flex-wrap w-full cursor-text transition-[color,background-color] items-center relative',
    leading: 'text-muted-foreground flex shrink-0 items-center',
    trailing: 'text-muted-foreground flex shrink-0 items-center',
    frame: `pointer-events-none transition-[border-color,box-shadow] absolute ${PEER_FOCUS_CLASS}  ${PEER_INVALID_CLASS}`,
  },
  defaultVariants: { size: 'md', variant: 'outline', orientation: 'horizontal', compact: false },
  variants: {
    size: {
      sm: {
        root: 'text-xs rounded-sm min-h-7',
        leading: 'gap-1',
        trailing: 'gap-1',
        frame: 'rounded-sm',
      },
      md: {
        root: 'text-sm rounded-md min-h-8',
        leading: 'gap-1.5',
        trailing: 'gap-1.5',
        frame: 'rounded-md',
      },
      lg: {
        root: 'text-base rounded-lg min-h-9',
        leading: 'gap-2',
        trailing: 'gap-2',
        frame: 'rounded-lg',
      },
    },
    orientation: {
      horizontal: {
        leading: '',
        trailing: '',
      },
      vertical: {
        leading: 'w-full',
        trailing: 'w-full',
      },
    },
    variant: {
      outline: {
        root: INPUT_VARIANT.outline,
        frame: 'border border-transparent -inset-px',
      },
      subtle: {
        root: INPUT_VARIANT.subtle,
        frame: 'border border-transparent -inset-px',
      },
      ghost: {
        root: `${INPUT_VARIANT.ghost} group/input-group`,
        leading:
          'group-focus-within/input-group:text-accent-foreground group-hover/input-group:text-accent-foreground',
        trailing:
          'group-focus-within/input-group:text-accent-foreground group-hover/input-group:text-accent-foreground',
        frame: 'inset-0',
      },
      none: {
        frame: 'inset-0 peer-focus:ring-0',
      },
    },
  },
  compoundVariants: [
    {
      variants: { orientation: 'horizontal', size: 'sm' },
      leading: 'px-1.5 data-compact:px-0.5',
      trailing: 'px-1.5 data-compact:px-0.5',
    },
    {
      variants: { orientation: 'horizontal', size: 'md' },
      leading: 'px-2 data-compact:px-1',
      trailing: 'px-2 data-compact:px-1',
    },
    {
      variants: { orientation: 'horizontal', size: 'lg' },
      leading: 'px-2.5 data-compact:px-1.5',
      trailing: 'px-2.5 data-compact:px-1.5',
    },
    {
      variants: { orientation: 'vertical', size: 'sm' },
      leading: 'p-1.5 data-compact:p-0.5',
      trailing: 'p-1.5 data-compact:p-0.5',
    },
    {
      variants: { orientation: 'vertical', size: 'md' },
      leading: 'p-2 data-compact:p-1',
      trailing: 'p-2 data-compact:p-1',
    },
    {
      variants: { orientation: 'vertical', size: 'lg' },
      leading: 'p-2.5 data-compact:p-1.5',
      trailing: 'p-2.5 data-compact:p-1.5',
    },
  ],
})
