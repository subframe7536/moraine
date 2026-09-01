import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

const SELECT_TEXT_SIZE = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const

export const SELECT_CONTROL_SEARCH_CLASS =
  'cursor-text focus-within:effect-fv-border focus-within:data-invalid:effect-invalid'
export const SELECT_CONTROL_POINTER_CLASS =
  'cursor-pointer focus-visible:effect-fv-border focus-visible:data-invalid:effect-invalid'

export const SELECT_VIEWPORT_CLASS = 'max-h-$mo-popper-content-available-height overflow-y-auto'

export const selectControlVariants = cva(
  'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:effect-invalid data-disabled:effect-dis data-invalid:ring-3 focus-visible:ring-3',
  {
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
    variants: {
      variant: INPUT_VARIANT,
      size: SELECT_TEXT_SIZE,
      mode: {
        single: '',
        multi: 'px-1.5',
      },
    },
    compoundVariants: [
      { size: 'sm', mode: 'single', class: 'pe-1.5 ps-2' },
      { size: 'md', mode: 'single', class: 'pe-2 ps-2.5' },
      { size: 'lg', mode: 'single', class: 'pe-2.5 ps-3' },
    ],
  },
)

export const selectInputVariants = cva(
  'outline-none bg-transparent flex-1 min-w-0 w-full disabled:effect-dis',
  {
    defaultVariants: {
      mode: 'single',
      size: 'md',
    },
    variants: {
      mode: {
        single: 'py-1.5',
        multi: 'leading-tight px-0.5 py-0.5 min-w-12',
      },
      size: SELECT_TEXT_SIZE,
    },
  },
)

export const multiSelectTagVariants = cva(
  'text-foreground leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-50% w-fit whitespace-nowrap items-center justify-center',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: SELECT_TEXT_SIZE,
    },
  },
)

export const multiSelectTagOverflowVariants = cva(
  'text-muted-foreground leading-tight px-1 flex items-center',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: SELECT_TEXT_SIZE,
    },
  },
)

export const SELECT_TRIGGER_ICON_CLASS =
  'text-muted-foreground outline-none opacity-80 shrink-0 pointer-events-none'
export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'

export const SELECT_CLEAR_ACTION_CLASS =
  'transition-colors hover:bg-muted-hover active:bg-muted-active'

export const selectItemVariants = cva(
  'px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'text-xs min-h-7',
        md: 'text-sm min-h-8',
        lg: 'text-base min-h-9',
      },
    },
  },
)

export const selectContentVariants = cva(
  'text-popover-foreground p-0 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-$mo-popper-content-transform-origin z-floating data-closed:animate-menu-out data-expanded:animate-menu-in',
  {
    defaultVariants: {
      side: 'right',
    },
    variants: {
      side: {
        top: 'mb-$mo-popper-content-overflow-padding animate-menu-side-top',
        right: 'ml-$mo-popper-content-overflow-padding animate-menu-side-right',
        bottom: 'mt-$mo-popper-content-overflow-padding animate-menu-side-bottom',
        left: 'mr-$mo-popper-content-overflow-padding animate-menu-side-left',
      },
    },
  },
)

export const SELECT_ROOT_CLASS = 'inline-flex h-fit w-full relative'
export const SELECT_GROUP_CLASS = '[&:not(:first-child)]:mt-1.5'
export const SELECT_GROUP_LABEL_CLASS =
  'text-xs text-muted-foreground font-medium px-2 py-1.5 block'
export const MULTI_SELECT_TAGS_WRAPPER_CLASS =
  'text-sm py-1.5 bg-transparent flex flex-1 flex-wrap gap-1 max-w-full select-none'
export const MULTI_SELECT_TAG_DELETE_CLASS =
  'p-0.5 appearance-none flex shrink-0 items-center justify-center -ms-1'
export const MULTI_SELECT_CLEAR_BUTTON_CLASS =
  'border border-transparent rounded-md inline-flex shrink-0 select-none items-center justify-center'
export const SELECT_CLEAR_BUTTON_CLASS =
  'border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center'
export const SELECT_ACTION_ICON_CLASS = 'text-muted-foreground opacity-80'
export const SELECT_EMPTY_CLASS = 'text-sm text-muted-foreground p-2 text-center'
export const SELECT_ITEM_DESCRIPTION_CLASS = 'text-xs text-muted-foreground block'
export const SELECT_ITEM_INDICATOR_CLASS =
  'text-sm flex shrink-0 size-4 pointer-events-none items-center end-2 justify-center absolute'

export type SelectControlVariantProps = VariantProps<typeof selectControlVariants>
