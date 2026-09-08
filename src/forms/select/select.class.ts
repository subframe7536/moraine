import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

const SELECT_CONTENT_CLASS =
  'text-popover-foreground p-0 outline-none rounded-md bg-popover flex flex-col min-w-36 origin-[var(--mo-popper-content-transform-origin)] z-floating motion-reduce:animate-none border border-border shadow-md data-closed:animate-mo-exit data-closed:exit-opacity-0 data-closed:exit-scale-95 data-expanded:animate-mo-enter data-expanded:enter-opacity-0 data-expanded:enter-scale-95'

export const SELECT_TRIGGER_ICON_CLASS =
  'data-loading:animate-spin text-muted-foreground outline-none opacity-80 shrink-0 pointer-events-none'
export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'

export const SELECT_CLEAR_ACTION_CLASS =
  '[&>[data-slot=icon]]:text-muted-foreground [&>[data-slot=icon]]:opacity-80 [&>[data-loading]]:animate-spin disabled:pointer-events-none data-loading:cursor-wait transition-colors hover:bg-muted-hover active:bg-muted-active duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]'

export const selectRecipeOptions = {
  base: {
    root: 'inline-flex h-fit w-full relative',
    content: /* @__PURE__ */ cn(
      /* @__PURE__ */ cn(
        SELECT_CONTENT_CLASS,
        'max-w-[var(--mo-popper-content-available-width)] min-w-[var(--mo-popper-anchor-width)] w-[var(--mo-popper-anchor-width)]',
      ),
      'data-[side=bottom]:mt-[var(--mo-popper-content-overflow-padding)] data-[side=left]:mr-[var(--mo-popper-content-overflow-padding)] data-[side=right]:ml-[var(--mo-popper-content-overflow-padding)] data-[side=top]:mb-[var(--mo-popper-content-overflow-padding)] data-[side=left]:enter-translate-x-1 data-[side=left]:exit-translate-x-1 data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1 data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=right]:-enter-translate-x-1 data-[side=right]:-exit-translate-x-1',
    ),
    listbox:
      'm-0 p-1 outline-none max-h-[var(--mo-popper-content-available-height)] overflow-y-auto',
    item: '[&_[data-option-wrapper]]:flex [&_[data-option-wrapper]]:flex-1 [&_[data-option-wrapper]]:gap-2 [&_[data-option-wrapper]]:min-w-0 [&_[data-option-wrapper]]:items-center [&_[data-option-icon]]:shrink-0 [&_[data-option-text]]:flex-1 [&_[data-option-text]]:min-w-0 px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:opacity-64 data-disabled:pointer-events-none',
    group: '[&:not(:first-child)]:mt-1.5',
    label: 'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
    control: /* @__PURE__ */ cn(
      'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)] items-center data-invalid:border-destructive data-disabled:opacity-64 data-disabled:pointer-events-none data-invalid:ring-3 data-invalid:ring-3 focus-visible:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40',
      'data-search:focus-within:data-invalid:border-destructive data-search:focus-within:data-invalid:ring-3 data-search:focus-within:data-invalid:ring-destructive/20 data-search:dark:focus-within:data-invalid:border-destructive/50 data-search:dark:focus-within:data-invalid:ring-destructive/40 data-[mode=multi]:px-1.5 [&:not([data-search])]:cursor-pointer data-search:cursor-text [&:not([data-search])]:focus-visible:outline-none data-search:focus-within:outline-none [&:not([data-search])]:focus-visible:border-ring data-search:focus-within:border-ring [&:not([data-search])]:focus-visible:ring-3 data-search:focus-within:ring-3 [&:not([data-search])]:focus-visible:ring-ring/50 data-search:focus-within:ring-ring/50 [&:not([data-search])]:focus-visible:data-invalid:border-destructive [&:not([data-search])]:focus-visible:data-invalid:ring-3 [&:not([data-search])]:focus-visible:data-invalid:ring-destructive/20 [&:not([data-search])]:dark:focus-visible:data-invalid:border-destructive/50 [&:not([data-search])]:dark:focus-visible:data-invalid:ring-destructive/40',
    ),
    input: /* @__PURE__ */ cn(
      'text-start outline-none bg-transparent flex-1 min-w-0 w-full truncate data-placeholder:text-muted-foreground disabled:opacity-64 read-only:cursor-pointer disabled:pointer-events-none',
      'data-[mode=multi]:leading-tight data-[mode=multi]:px-0.5 data-[mode=multi]:py-0.5 data-[mode=single]:py-1.5 data-[mode=multi]:min-w-12',
    ),
    leading: SELECT_LEADING_ICON_CLASS,
    trigger: SELECT_TRIGGER_ICON_CLASS,
    clear: /* @__PURE__ */ cn(
      SELECT_CLEAR_ACTION_CLASS,
      'border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center',
    ),
    empty: 'text-sm text-muted-foreground p-2 text-center',
    itemLabel: 'truncate',
    itemDescription: 'text-xs text-muted-foreground block',
    itemTrailing:
      'text-sm flex shrink-0 size-4 pointer-events-none items-center end-2 justify-center absolute',
  },
  defaults: {
    variant: 'outline',
    size: 'md',
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
  },
  compoundVariants: [
    {
      variants: { size: 'sm' },
      class: { control: 'data-[mode=single]:pe-1.5 data-[mode=single]:ps-2' },
    },
    {
      variants: { size: 'md' },
      class: { control: 'data-[mode=single]:pe-2 data-[mode=single]:ps-2.5' },
    },
    {
      variants: { size: 'lg' },
      class: { control: 'data-[mode=single]:pe-2.5 data-[mode=single]:ps-3' },
    },
  ],
} as const

export const selectRecipe = /* @__PURE__ */ slotRecipe(selectRecipeOptions)

export const multiSelectRecipeOptions = {
  base: {
    root: 'inline-flex h-fit w-full relative',
    content: /* @__PURE__ */ cn(
      /* @__PURE__ */ cn(
        SELECT_CONTENT_CLASS,
        'max-w-[var(--mo-popper-content-available-width)] min-w-[var(--mo-popper-anchor-width)] w-[var(--mo-popper-anchor-width)]',
      ),
      'data-[side=bottom]:mt-[var(--mo-popper-content-overflow-padding)] data-[side=left]:mr-[var(--mo-popper-content-overflow-padding)] data-[side=right]:ml-[var(--mo-popper-content-overflow-padding)] data-[side=top]:mb-[var(--mo-popper-content-overflow-padding)] data-[side=left]:enter-translate-x-1 data-[side=left]:exit-translate-x-1 data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1 data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=right]:-enter-translate-x-1 data-[side=right]:-exit-translate-x-1',
    ),
    listbox:
      'm-0 p-1 outline-none max-h-[var(--mo-popper-content-available-height)] overflow-y-auto',
    item: '[&_[data-option-wrapper]]:flex [&_[data-option-wrapper]]:flex-1 [&_[data-option-wrapper]]:gap-2 [&_[data-option-wrapper]]:min-w-0 [&_[data-option-wrapper]]:items-center [&_[data-option-icon]]:shrink-0 [&_[data-option-text]]:flex-1 [&_[data-option-text]]:min-w-0 px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:opacity-64 data-disabled:pointer-events-none',
    group: '[&:not(:first-child)]:mt-1.5',
    label: 'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
    control: /* @__PURE__ */ cn(
      'text-foreground px-1.5 outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)] items-center data-invalid:border-destructive data-disabled:opacity-64 data-disabled:pointer-events-none data-invalid:ring-3 data-invalid:ring-3 focus-visible:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40',
      'data-search:focus-within:data-invalid:border-destructive data-search:focus-within:data-invalid:ring-3 data-search:focus-within:data-invalid:ring-destructive/20 data-search:dark:focus-within:data-invalid:border-destructive/50 data-search:dark:focus-within:data-invalid:ring-destructive/40 [&:not([data-search])]:cursor-pointer data-search:cursor-text [&:not([data-search])]:focus-visible:outline-none data-search:focus-within:outline-none [&:not([data-search])]:focus-visible:border-ring data-search:focus-within:border-ring [&:not([data-search])]:focus-visible:ring-3 data-search:focus-within:ring-3 [&:not([data-search])]:focus-visible:ring-ring/50 data-search:focus-within:ring-ring/50 [&:not([data-search])]:focus-visible:data-invalid:border-destructive [&:not([data-search])]:focus-visible:data-invalid:ring-3 [&:not([data-search])]:focus-visible:data-invalid:ring-destructive/20 [&:not([data-search])]:dark:focus-visible:data-invalid:border-destructive/50 [&:not([data-search])]:dark:focus-visible:data-invalid:ring-destructive/40',
    ),
    input:
      'read-only:cursor-pointer outline-none bg-transparent flex-1 min-w-0 w-full disabled:opacity-64 disabled:pointer-events-none leading-tight px-0.5 py-0.5 min-w-12',
    leading: SELECT_LEADING_ICON_CLASS,
    trigger:
      'outline-none shrink-0 cursor-pointer disabled:pointer-events-none data-loading:cursor-wait [&>[data-slot=icon]]:text-muted-foreground [&>[data-slot=icon]]:opacity-80 [&>[data-loading]]:animate-spin',
    clear: /* @__PURE__ */ cn(
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
  defaults: {
    variant: 'outline',
    size: 'md',
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
  },
} as const

export const multiSelectRecipe = /* @__PURE__ */ slotRecipe(multiSelectRecipeOptions)
