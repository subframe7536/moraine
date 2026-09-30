import { defineRecipe } from '../../theme/recipe'
import {
  ARIA_DISABLED_CLASS,
  DISABLED_CLASS,
  FOCUS_VISIBLE_CLASS,
} from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ButtonStyleSlot, ButtonStyleVariant } from './button.style-types'

export const buttonDataAttributes = {
  root: createDataAttributes('disabled', 'loading'),
} satisfies DataAttributeContract<keyof ButtonStyleSlot>

export const buttonRecipe = /* @__PURE__ */ defineRecipe<ButtonStyleSlot, ButtonStyleVariant>(
  'button',
  {
    base: {
      root: `border inline-flex gap-1.5 cursor-pointer select-none whitespace-nowrap transition-[colors,transform,box-shadow] items-center justify-center bg-clip-padding ${FOCUS_VISIBLE_CLASS} aria-invalid:(border-destructive ring-3 ring-destructive/20) ${ARIA_DISABLED_CLASS} ${DISABLED_CLASS} [&:active:not([aria-haspopup])]:translate-y-px`,
      leading: '',
      label: 'min-w-0 truncate',
      trailing: '',
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default: {
          root: 'text-primary-foreground border-transparent bg-primary active:bg-primary-active hover:bg-primary-hover',
        },
        secondary: {
          root: 'text-secondary-foreground border-transparent bg-secondary active:bg-secondary-active hover:bg-secondary-hover',
        },
        outline: {
          root: 'border-border bg-background hover:(text-foreground bg-background-hover) dark:border-input active:bg-background-active',
        },
        ghost: {
          root: 'border-transparent active:(text-accent-foreground bg-accent-active) hover:(text-accent-foreground bg-accent-hover)',
        },
        link: {
          root: 'text-primary border-transparent underline-offset-4 hover:underline',
        },
        destructive: {
          root: 'text-destructive-foreground border-transparent bg-destructive focus-visible:(border-destructive/40 ring-destructive/20) active:bg-destructive-active hover:bg-destructive-hover dark:focus-visible:ring-destructive/40',
        },
      },
      size: {
        xs: { root: 'text-xs px-1.5 rounded-sm h-6' },
        sm: { root: 'text-sm px-2 rounded-md h-7' },
        md: { root: 'text-sm px-2.5 rounded-lg h-8' },
        lg: { root: 'text-base px-3 rounded-lg h-9' },
        xl: { root: 'text-lg px-4 rounded-lg h-11' },
        'icon-xs': { root: 'text-xs rounded-sm size-6' },
        'icon-sm': { root: 'text-sm rounded-md size-7' },
        'icon-md': { root: 'text-sm rounded-lg size-8' },
        'icon-lg': { root: 'text-base rounded-lg size-9' },
        'icon-xl': { root: 'text-lg rounded-lg size-11' },
      },
    },
  },
)
