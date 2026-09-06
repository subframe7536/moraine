import { INPUT_VARIANT, POPPER_CONTENT_SIDE_VARIANT } from '../../shared/recipe-common.class.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

const SELECT_CONTENT_CLASS =
  'text-popover-foreground p-0 outline-none rounded-md bg-popover flex flex-col min-w-36 origin-[var(--mo-popper-content-transform-origin)] z-floating motion-reduce:animate-none border border-border shadow-md data-closed:animate-mo-exit data-closed:exit-opacity-0 data-closed:exit-scale-95 data-expanded:animate-mo-enter data-expanded:enter-opacity-0 data-expanded:enter-scale-95'

export const SELECT_TRIGGER_ICON_CLASS =
  'data-loading:animate-spin text-muted-foreground outline-none opacity-80 shrink-0 pointer-events-none'
export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'

export const SELECT_CLEAR_ACTION_CLASS =
  '[&>[data-slot=icon]]:text-muted-foreground [&>[data-slot=icon]]:opacity-80 [&>[data-loading]]:animate-spin disabled:pointer-events-none data-loading:cursor-wait transition-colors hover:bg-muted-hover active:bg-muted-active duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]'

export const selectItemVariants = recipe({
  base: 'px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:opacity-64 data-disabled:pointer-events-none',
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
})

export const selectContentVariants = recipe({
  base: SELECT_CONTENT_CLASS,
  defaultVariants: {
    side: 'right',
  },
  variants: {
    side: POPPER_CONTENT_SIDE_VARIANT,
  },
})

export const selectRecipeOptions = {
  base: {
    root: 'inline-flex h-fit w-full relative',
    content: cn(
      SELECT_CONTENT_CLASS,
      'max-w-[var(--mo-popper-content-available-width)] min-w-[var(--mo-popper-anchor-width)] w-[var(--mo-popper-anchor-width)]',
    ),
    listbox:
      'm-0 p-1 outline-none max-h-[var(--mo-popper-content-available-height)] overflow-y-auto',
    item: '[&_[data-option-wrapper]]:flex [&_[data-option-wrapper]]:flex-1 [&_[data-option-wrapper]]:gap-2 [&_[data-option-wrapper]]:min-w-0 [&_[data-option-wrapper]]:items-center [&_[data-option-icon]]:shrink-0 [&_[data-option-text]]:flex-1 [&_[data-option-text]]:min-w-0 px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:opacity-64 data-disabled:pointer-events-none',
    group: '[&:not(:first-child)]:mt-1.5',
    label: 'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
    control:
      'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-disabled:opacity-64 data-disabled:pointer-events-none data-invalid:ring-3 focus-visible:ring-3 duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    input:
      'text-start truncate data-placeholder:text-muted-foreground read-only:cursor-pointer outline-none bg-transparent flex-1 min-w-0 w-full disabled:opacity-64 disabled:pointer-events-none',
    leading: SELECT_LEADING_ICON_CLASS,
    trigger: SELECT_TRIGGER_ICON_CLASS,
    clear: cn(
      SELECT_CLEAR_ACTION_CLASS,
      'border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center',
    ),
    empty: 'text-sm text-muted-foreground p-2 text-center',
    itemLabel: 'truncate',
    itemDescription: 'text-xs text-muted-foreground block',
    itemTrailing:
      'text-sm flex shrink-0 size-4 pointer-events-none items-center end-2 justify-center absolute',
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
    mode: 'single',
    search: false,
    side: 'right',
  },
  variants: {
    variant: {
      outline: { control: INPUT_VARIANT.outline },
      subtle: { control: INPUT_VARIANT.subtle },
      ghost: { control: INPUT_VARIANT.ghost },
      none: { control: INPUT_VARIANT.none },
    },
    size: {
      sm: {
        control: 'text-xs',
        input: 'text-xs',
        item: 'text-xs min-h-7',
      },
      md: {
        control: 'text-sm',
        input: 'text-sm',
        item: 'text-sm min-h-8',
      },
      lg: {
        control: 'text-base',
        input: 'text-base',
        item: 'text-base min-h-9',
      },
    },
    mode: {
      single: {
        input: 'py-1.5',
      },
      multi: {
        control: 'px-1.5',
        input: 'leading-tight px-0.5 py-0.5 min-w-12',
      },
    },
    search: {
      true: {
        control:
          'cursor-text focus-within:outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 focus-within:data-invalid:border-destructive focus-within:data-invalid:ring-3 focus-within:data-invalid:ring-destructive/20 dark:focus-within:data-invalid:border-destructive/50 dark:focus-within:data-invalid:ring-destructive/40',
      },
      false: {
        control:
          'cursor-pointer focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:data-invalid:border-destructive focus-visible:data-invalid:ring-3 focus-visible:data-invalid:ring-destructive/20 dark:focus-visible:data-invalid:border-destructive/50 dark:focus-visible:data-invalid:ring-destructive/40',
      },
    },
    side: {
      top: { content: POPPER_CONTENT_SIDE_VARIANT.top },
      right: { content: POPPER_CONTENT_SIDE_VARIANT.right },
      bottom: { content: POPPER_CONTENT_SIDE_VARIANT.bottom },
      left: { content: POPPER_CONTENT_SIDE_VARIANT.left },
    },
  },
  compoundVariants: [
    { variants: { size: 'sm', mode: 'single' }, class: { control: 'pe-1.5 ps-2' } },
    { variants: { size: 'md', mode: 'single' }, class: { control: 'pe-2 ps-2.5' } },
    { variants: { size: 'lg', mode: 'single' }, class: { control: 'pe-2.5 ps-3' } },
  ],
} as const

export const selectRecipe = recipe(selectRecipeOptions)

export const multiSelectRecipeOptions = {
  base: {
    root: 'inline-flex h-fit w-full relative',
    content: cn(
      SELECT_CONTENT_CLASS,
      'max-w-[var(--mo-popper-content-available-width)] min-w-[var(--mo-popper-anchor-width)] w-[var(--mo-popper-anchor-width)]',
    ),
    listbox:
      'm-0 p-1 outline-none max-h-[var(--mo-popper-content-available-height)] overflow-y-auto',
    item: '[&_[data-option-wrapper]]:flex [&_[data-option-wrapper]]:flex-1 [&_[data-option-wrapper]]:gap-2 [&_[data-option-wrapper]]:min-w-0 [&_[data-option-wrapper]]:items-center [&_[data-option-icon]]:shrink-0 [&_[data-option-text]]:flex-1 [&_[data-option-text]]:min-w-0 px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:opacity-64 data-disabled:pointer-events-none',
    group: '[&:not(:first-child)]:mt-1.5',
    label: 'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
    control:
      'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-disabled:opacity-64 data-disabled:pointer-events-none data-invalid:ring-3 focus-visible:ring-3 px-1.5 duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    input:
      'read-only:cursor-pointer outline-none bg-transparent flex-1 min-w-0 w-full disabled:opacity-64 disabled:pointer-events-none leading-tight px-0.5 py-0.5 min-w-12',
    leading: SELECT_LEADING_ICON_CLASS,
    trigger:
      'outline-none shrink-0 cursor-pointer disabled:pointer-events-none data-loading:cursor-wait [&>[data-slot=icon]]:text-muted-foreground [&>[data-slot=icon]]:opacity-80 [&>[data-loading]]:animate-spin',
    clear: cn(
      SELECT_CLEAR_ACTION_CLASS,
      'border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center',
    ),
    tagsContainer:
      'text-sm py-1.5 bg-transparent flex flex-1 flex-wrap gap-1 max-w-full select-none',
    tag: '[&>[data-slot=label]]:min-w-0 [&>[data-slot=label]]:truncate text-foreground leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-50% w-fit whitespace-nowrap items-center justify-center',
    tagRemove:
      'p-0.5 appearance-none flex shrink-0 items-center justify-center -ms-1 cursor-pointer disabled:pointer-events-none [&>[data-slot=icon]]:opacity-50 [&:not(:disabled)>[data-slot=icon]:hover]:opacity-100',
    tagOverflow: 'text-muted-foreground leading-tight px-1 flex items-center',
    empty: 'text-sm text-muted-foreground p-2 text-center',
    itemLabel: 'truncate',
    itemDescription: 'text-xs text-muted-foreground block',
    itemTrailing:
      'text-sm flex shrink-0 size-4 pointer-events-none items-center end-2 justify-center absolute',
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
    search: false,
    side: 'right',
  },
  variants: {
    variant: {
      outline: { control: INPUT_VARIANT.outline },
      subtle: { control: INPUT_VARIANT.subtle },
      ghost: { control: INPUT_VARIANT.ghost },
      none: { control: INPUT_VARIANT.none },
    },
    size: {
      sm: {
        control: 'text-xs',
        input: 'text-xs leading-tight',
        tagsContainer: 'text-xs',
        tag: 'text-xs leading-tight',
        tagOverflow: 'text-xs leading-tight',
        item: 'text-xs min-h-7',
      },
      md: {
        control: 'text-sm',
        input: 'text-sm leading-tight',
        tagsContainer: 'text-sm',
        tag: 'text-sm leading-tight',
        tagOverflow: 'text-sm leading-tight',
        item: 'text-sm min-h-8',
      },
      lg: {
        control: 'text-base',
        input: 'text-base leading-tight',
        tagsContainer: 'text-base',
        tag: 'text-base leading-tight',
        tagOverflow: 'text-base leading-tight',
        item: 'text-base min-h-9',
      },
    },
    search: {
      true: {
        control:
          'cursor-text focus-within:outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 focus-within:data-invalid:border-destructive focus-within:data-invalid:ring-3 focus-within:data-invalid:ring-destructive/20 dark:focus-within:data-invalid:border-destructive/50 dark:focus-within:data-invalid:ring-destructive/40',
      },
      false: {
        control:
          'cursor-pointer focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:data-invalid:border-destructive focus-visible:data-invalid:ring-3 focus-visible:data-invalid:ring-destructive/20 dark:focus-visible:data-invalid:border-destructive/50 dark:focus-visible:data-invalid:ring-destructive/40',
      },
    },
    side: {
      top: { content: POPPER_CONTENT_SIDE_VARIANT.top },
      right: { content: POPPER_CONTENT_SIDE_VARIANT.right },
      bottom: { content: POPPER_CONTENT_SIDE_VARIANT.bottom },
      left: { content: POPPER_CONTENT_SIDE_VARIANT.left },
    },
  },
} as const

export const multiSelectRecipe = recipe(multiSelectRecipeOptions)

export type SelectVariantProps = VariantProps<typeof selectRecipe>
export type SelectControlVariantProps = SelectVariantProps
export type MultiSelectVariantProps = VariantProps<typeof multiSelectRecipe>
