import { defineRecipe } from '../../theme/recipe'
import { ARIA_DISABLED_CLASS, DISABLED_CLASS, TONE_VARS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ButtonStyleSlot, ButtonStyleVariant } from './button.style-types'

export const BUTTON_LOADING_ICON_CLASS = 'opacity-80 cursor-wait animate-spin'
export const BUTTON_MOVE_DOWN_ACTIVE_EFFECT_CLASS = '[&:active:not([aria-haspopup])]:translate-y-px'
export const BUTTON_ZOOM_IN_ACTIVE_EFFECT_CLASS = '[&:active:not([aria-haspopup])]:scale-98'

export const buttonDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('disabled', 'loading'),
} satisfies DataAttributeContract<keyof ButtonStyleSlot>

export const buttonRecipe = /* @__PURE__ */ defineRecipe<ButtonStyleSlot, ButtonStyleVariant>(
  'button',
  {
    base: {
      root: `border inline-flex gap-1.5 cursor-pointer select-none whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] items-center justify-center bg-clip-padding focus-visible:(outline-none ring-3 ring-tone/20 dark:ring-tone/40) aria-invalid:(border-danger ring-3 ring-danger/20) ${ARIA_DISABLED_CLASS}  ${DISABLED_CLASS}`,
      leading: '',
      label: 'min-w-0 truncate',
      trailing: '',
    },
    defaultVariants: {
      size: 'md',
      variant: 'solid',
      tone: 'primary',
      activeEffect: 'move-down',
    },
    variants: {
      activeEffect: {
        none: { root: '' },
        'move-down': { root: BUTTON_MOVE_DOWN_ACTIVE_EFFECT_CLASS },
        'zoom-in': { root: BUTTON_ZOOM_IN_ACTIVE_EFFECT_CLASS },
      },
      variant: {
        solid: {
          root: 'text-tone-foreground border-transparent bg-tone active:bg-tone-active hover:bg-tone-hover',
        },
        soft: {
          root: 'text-tone-ink border-transparent bg-tone/12 active:bg-tone/24 hover:bg-tone/18',
        },
        outline: {
          root: 'text-tone-ink border-tone/20 bg-transparent active:bg-tone/12 hover:bg-tone/8',
        },
        ghost: {
          root: 'text-tone-ink border-transparent active:bg-tone/16 hover:bg-tone/10',
        },
        link: {
          root: 'text-tone-ink border-transparent underline-offset-4 hover:underline',
        },
      },
      tone: TONE_VARS,
      size: {
        xs: { root: 'text-tiny px-1.5 rounded-xs h-6' },
        sm: { root: 'text-xs px-2 rounded-sm h-7' },
        md: { root: 'text-sm px-2.5 rounded-md h-8' },
        lg: { root: 'text-base px-3 rounded-lg h-9' },
        xl: { root: 'text-lg px-4 rounded-lg h-10' },
        'icon-xs': { root: 'text-tiny rounded-xs size-5' },
        'icon-sm': { root: 'text-xs rounded-sm size-6' },
        'icon-md': { root: 'text-sm rounded-md size-7' },
        'icon-lg': { root: 'text-base rounded-lg size-8' },
        'icon-xl': { root: 'text-lg rounded-lg size-9' },
      },
    },
  },
)
