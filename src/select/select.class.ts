import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const selectRootClasses = 'relative inline-flex w-full h-fit'

export const selectControlVariants = cva(
  'flex w-full cursor-pointer items-center rounded-md text-foreground outline-none',
  {
    defaultVariants: {
      color: 'primary',
      size: 'md',
      variant: 'outline',
    },
    variants: {
      color: {
        primary: 'focus-within:(ring-2 ring-inset ring-primary)',
        secondary: 'focus-within:(ring-2 ring-inset ring-secondary)',
        neutral: 'focus-within:(ring-2 ring-inset ring-foreground)',
        error: 'focus-within:(ring-2 ring-inset ring-destructive)',
      },
      size: {
        sm: 'min-h-8 text-xs',
        md: 'min-h-9 text-sm',
        lg: 'min-h-10 text-sm',
      },
      variant: {
        outline: 'border bg-background',
        soft: 'border-transparent bg-muted/50 hover:bg-muted',
        subtle: 'border bg-muted',
        ghost: 'border-transparent hover:bg-muted',
        none: 'border-transparent',
      },
      highlight: {
        true: 'ring-1 ring-inset ring-border',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-75',
      },
      invalid: {
        true: 'border-destructive/36',
      },
    },
    compoundVariants: [
      { color: 'primary', highlight: 'true', class: 'ring-primary' },
      { color: 'secondary', highlight: 'true', class: 'ring-secondary' },
      { color: 'neutral', highlight: 'true', class: 'ring-foreground' },
      { color: 'error', highlight: 'true', class: 'ring-destructive' },
    ],
  },
)

export const selectInputVariants = cva(
  'flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
  {
    defaultVariants: {
      size: 'md',
      mode: 'single',
    },
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
      mode: {
        single: 'min-w-0',
        multiSearch: 'min-w-12 h-6 py-0.5',
        multiHidden: 'absolute h-0 w-0 overflow-hidden border-0 p-0 opacity-0',
      },
      readOnly: {
        true: 'cursor-pointer',
      },
    },
    compoundVariants: [
      { mode: 'single', size: 'sm', class: 'h-7 px-2.5 text-xs' },
      { mode: 'single', size: 'md', class: 'h-8 px-2.5 text-sm' },
      { mode: 'single', size: 'lg', class: 'h-9 px-3 text-sm' },
      { mode: 'multiSearch', size: 'sm', class: 'ps-1 text-xs' },
      { mode: 'multiSearch', size: 'md', class: 'ps-1 text-sm' },
      { mode: 'multiSearch', size: 'lg', class: 'ps-1.5 text-sm' },
    ],
  },
)

export const selectTriggerIconVariants = cva('shrink-0 text-muted-foreground opacity-80', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'me-1.5 text-sm',
      md: 'me-2 text-base',
      lg: 'me-2.5 text-base',
    },
  },
})

export const selectLeadingIconVariants = cva('shrink-0 text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'ms-2 text-sm',
      md: 'ms-2.5 text-base',
      lg: 'ms-3 text-base',
    },
  },
})

export const selectClearVariants = cva(
  'shrink-0 cursor-pointer text-muted-foreground opacity-80 transition-opacity hover:opacity-100',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'me-1 text-xs',
        md: 'me-1.5 text-sm',
        lg: 'me-2 text-sm',
      },
    },
  },
)

export const selectContentClasses =
  'z-50 rounded-lg border bg-popover text-popover-foreground shadow-lg overflow-hidden max-h-(--kb-popper-available-height) min-w-32 origin-(--kb-combobox-content-transform-origin) overflow-y-auto overflow-x-hidden data-[expanded]:(animate-in fade-in-0 zoom-in-95) data-[closed]:(animate-out fade-out-0 zoom-out-95) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 mt-(--kb-popper-content-overflow-padding)'

export const selectListboxClasses = 'max-h-60 overflow-y-auto p-1 outline-none'

export const selectItemVariants = cva(
  'grid cursor-default grid-cols-[1fr_1rem] items-center gap-2 rounded-sm py-1 ps-3 pe-2 outline-none data-[disabled]:(pointer-events-none opacity-50) data-[highlighted]:(bg-accent text-accent-foreground)',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'min-h-7 text-xs',
        md: 'min-h-8 text-sm',
        lg: 'min-h-9 text-sm',
      },
    },
  },
)

export const selectItemIndicatorClasses =
  'col-start-2 inline-flex items-center justify-center text-sm'

export const selectItemLabelClasses = 'col-start-1 truncate'

export const selectItemDescriptionClasses = 'col-start-1 text-xs text-muted-foreground'

export const selectSectionClasses = '[&:not(:first-child)]:mt-1.5'

export const selectSectionLabelClasses =
  'block px-2 py-1.5 font-medium text-muted-foreground text-xs'

export const selectTagsContainerClasses =
  'flex flex-1 cursor-pointer select-none flex-wrap items-center gap-1 p-1.5'

export const selectTagVariants = cva(
  'flex items-center rounded-md bg-accent px-2 font-medium text-accent-foreground text-sm',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-sm',
      },
    },
  },
)

export const selectTagRemoveClasses =
  'h-full shrink-0 cursor-pointer ps-1 opacity-80 transition-opacity hover:opacity-100'

export const selectEmptyClasses = 'p-2 text-center text-muted-foreground text-sm'

export type SelectControlVariantProps = VariantProps<typeof selectControlVariants>
