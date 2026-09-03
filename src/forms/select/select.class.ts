import { INPUT_VARIANT } from '../../shared/cva-common.class.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

const SELECT_TEXT_SIZE = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const

export const selectControlVariants = recipe({
  base: 'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-disabled:opacity-64 data-disabled:pointer-events-none data-invalid:ring-3 focus-visible:ring-3',
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
    search: {
      true: 'cursor-text focus-within:outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 focus-within:data-invalid:border-destructive focus-within:data-invalid:ring-3 focus-within:data-invalid:ring-destructive/20 dark:focus-within:data-invalid:border-destructive/50 dark:focus-within:data-invalid:ring-destructive/40',
      false:
        'cursor-pointer focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:data-invalid:border-destructive focus-visible:data-invalid:ring-3 focus-visible:data-invalid:ring-destructive/20 dark:focus-visible:data-invalid:border-destructive/50 dark:focus-visible:data-invalid:ring-destructive/40',
    },
  },
  compoundVariants: [
    { variants: { size: 'sm', mode: 'single' }, class: 'pe-1.5 ps-2' },
    { variants: { size: 'md', mode: 'single' }, class: 'pe-2 ps-2.5' },
    { variants: { size: 'lg', mode: 'single' }, class: 'pe-2.5 ps-3' },
  ],
})

export const selectInputVariants = recipe({
  base: 'outline-none bg-transparent flex-1 min-w-0 w-full disabled:opacity-64 disabled:pointer-events-none',
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
})

export const multiSelectTagVariants = recipe({
  base: 'text-foreground leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-50% w-fit whitespace-nowrap items-center justify-center',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-xs leading-tight',
      md: 'text-sm leading-tight',
      lg: 'text-base leading-tight',
    },
  },
})

export const multiSelectTagOverflowVariants = recipe({
  base: 'text-muted-foreground leading-tight px-1 flex items-center',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-xs leading-tight',
      md: 'text-sm leading-tight',
      lg: 'text-base leading-tight',
    },
  },
})

export const SELECT_TRIGGER_ICON_CLASS =
  'text-muted-foreground outline-none opacity-80 shrink-0 pointer-events-none'
export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'

export const SELECT_CLEAR_ACTION_CLASS =
  'transition-colors hover:bg-muted-hover active:bg-muted-active'

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
  base: 'text-popover-foreground p-0 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-[var(--mo-popper-content-transform-origin)] z-floating data-closed:animate-menu-out data-expanded:animate-menu-in',
  defaultVariants: {
    side: 'right',
  },
  variants: {
    side: {
      top: 'mb-[var(--mo-popper-content-overflow-padding)] animate-menu-side-top',
      right: 'ml-[var(--mo-popper-content-overflow-padding)] animate-menu-side-right',
      bottom: 'mt-[var(--mo-popper-content-overflow-padding)] animate-menu-side-bottom',
      left: 'mr-[var(--mo-popper-content-overflow-padding)] animate-menu-side-left',
    },
  },
})

export const selectRecipe = recipe({
  slots: [
    'root',
    'content',
    'listbox',
    'item',
    'group',
    'label',
    'control',
    'input',
    'leading',
    'trigger',
    'clear',
    'empty',
    'itemLabel',
    'itemDescription',
    'itemTrailing',
  ],
  base: {
    root: '',
    content:
      'text-popover-foreground p-0 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-[var(--mo-popper-content-transform-origin)] z-floating data-closed:animate-menu-out data-expanded:animate-menu-in',
    listbox: '',
    item: 'px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:opacity-64 data-disabled:pointer-events-none',
    group: '',
    label: '',
    control:
      'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-disabled:opacity-64 data-disabled:pointer-events-none data-invalid:ring-3 focus-visible:ring-3',
    input:
      'outline-none bg-transparent flex-1 min-w-0 w-full disabled:opacity-64 disabled:pointer-events-none',
    leading: SELECT_LEADING_ICON_CLASS,
    trigger: SELECT_TRIGGER_ICON_CLASS,
    clear: SELECT_CLEAR_ACTION_CLASS,
    empty: '',
    itemLabel: '',
    itemDescription: '',
    itemTrailing: '',
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
      top: { content: 'mb-[var(--mo-popper-content-overflow-padding)] animate-menu-side-top' },
      right: { content: 'ml-[var(--mo-popper-content-overflow-padding)] animate-menu-side-right' },
      bottom: {
        content: 'mt-[var(--mo-popper-content-overflow-padding)] animate-menu-side-bottom',
      },
      left: { content: 'mr-[var(--mo-popper-content-overflow-padding)] animate-menu-side-left' },
    },
  },
  compoundVariants: [
    { variants: { size: 'sm', mode: 'single' }, class: { control: 'pe-1.5 ps-2' } },
    { variants: { size: 'md', mode: 'single' }, class: { control: 'pe-2 ps-2.5' } },
    { variants: { size: 'lg', mode: 'single' }, class: { control: 'pe-2.5 ps-3' } },
  ],
})

export const multiSelectRecipe = recipe({
  slots: [
    'root',
    'content',
    'listbox',
    'item',
    'group',
    'label',
    'control',
    'input',
    'leading',
    'trigger',
    'clear',
    'tagsContainer',
    'tag',
    'tagRemove',
    'tagOverflow',
    'empty',
    'itemLabel',
    'itemDescription',
    'itemTrailing',
  ],
  base: {
    root: '',
    content:
      'text-popover-foreground p-0 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-[var(--mo-popper-content-transform-origin)] z-floating data-closed:animate-menu-out data-expanded:animate-menu-in',
    listbox: '',
    item: 'px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:opacity-64 data-disabled:pointer-events-none',
    group: '',
    label: '',
    control:
      'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-disabled:opacity-64 data-disabled:pointer-events-none data-invalid:ring-3 focus-visible:ring-3 px-1.5',
    input:
      'outline-none bg-transparent flex-1 min-w-0 w-full disabled:opacity-64 disabled:pointer-events-none leading-tight px-0.5 py-0.5 min-w-12',
    leading: SELECT_LEADING_ICON_CLASS,
    trigger: SELECT_TRIGGER_ICON_CLASS,
    clear: SELECT_CLEAR_ACTION_CLASS,
    tagsContainer: '',
    tag: 'text-foreground leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-50% w-fit whitespace-nowrap items-center justify-center',
    tagRemove: '',
    tagOverflow: 'text-muted-foreground leading-tight px-1 flex items-center',
    empty: '',
    itemLabel: '',
    itemDescription: '',
    itemTrailing: '',
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
        tag: 'text-xs leading-tight',
        tagOverflow: 'text-xs leading-tight',
        item: 'text-xs min-h-7',
      },
      md: {
        control: 'text-sm',
        input: 'text-sm leading-tight',
        tag: 'text-sm leading-tight',
        tagOverflow: 'text-sm leading-tight',
        item: 'text-sm min-h-8',
      },
      lg: {
        control: 'text-base',
        input: 'text-base leading-tight',
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
      top: { content: 'mb-[var(--mo-popper-content-overflow-padding)] animate-menu-side-top' },
      right: { content: 'ml-[var(--mo-popper-content-overflow-padding)] animate-menu-side-right' },
      bottom: {
        content: 'mt-[var(--mo-popper-content-overflow-padding)] animate-menu-side-bottom',
      },
      left: { content: 'mr-[var(--mo-popper-content-overflow-padding)] animate-menu-side-left' },
    },
  },
})

export type SelectControlVariantProps = VariantProps<typeof selectControlVariants>
