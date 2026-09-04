import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const checkboxRecipe = recipe({
  slots: ['root', 'control', 'indicator', 'icon', 'wrapper', 'container', 'label', 'description'],
  base: {
    root: 'flex items-start relative',
    control:
      'outline-none border border-input rounded-xs bg-background inline-flex shrink-0 cursor-pointer shadow-xs transition-shadow items-center justify-center overflow-hidden bg-clip-padding focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-primary data-checked:bg-primary data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 dark:bg-input/30',
    indicator: '',
    icon: '',
    wrapper: 'flex flex-col gap-0.5 w-full',
    container: 'flex items-center',
    label: 'text-foreground font-medium block select-none',
    description: '',
  },
  defaultVariants: {
    size: 'md',
    indicator: 'start',
  },
  variants: {
    variant: {
      card: { root: 'border border-border rounded-md' },
      list: {},
    },
    indicator: {
      start: { root: 'flex-row', wrapper: 'ms-2' },
      end: { root: 'flex-row-reverse', wrapper: 'me-2' },
      hidden: { wrapper: '' },
    },
    size: {
      sm: {
        control: 'size-3.5',
        container: 'h-4',
        wrapper: 'text-xs',
      },
      md: {
        control: 'size-4',
        container: 'h-5',
        wrapper: 'text-sm',
      },
      lg: {
        control: 'size-4.5',
        container: 'h-6',
        wrapper: 'text-base',
      },
    },
    required: {
      true: {
        label: "after:text-destructive after:ms-0.5 after:content-['*']",
      },
    },
  },
})

export const checkboxCardPaddingVariants = recipe({
  base: 'p-3',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'p-3',
      md: 'p-3.5',
      lg: 'p-4',
    },
  },
})

export type CheckboxVariantProps = VariantProps<typeof checkboxRecipe>
