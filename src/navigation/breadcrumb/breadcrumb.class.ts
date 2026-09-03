import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const BREADCRUMB_ROOT_CLASS = 'min-w-0 relative'
export const BREADCRUMB_ITEM_CLASS = 'inline-flex items-center gap-1'
export const BREADCRUMB_LINK_CLASS =
  'transition-colors hover:text-foreground inline-flex items-center gap-1.5'
export const BREADCRUMB_PAGE_CLASS = 'text-foreground font-normal inline-flex items-center gap-1'
export const BREADCRUMB_DISABLED_CLASS =
  'aria-disabled:opacity-64 aria-disabled:pointer-events-none'
export const BREADCRUMB_TRUNCATE_CLASS = 'min-w-0 truncate'
export const BREADCRUMB_SEPARATOR_CLASS =
  'text-muted-foreground inline-flex shrink-0 items-center justify-center'

export const breadcrumbRecipe = recipe({
  slots: ['root', 'list', 'item', 'link', 'leading', 'label', 'separator'],
  base: {
    root: BREADCRUMB_ROOT_CLASS,
    list: 'text-sm text-muted-foreground flex gap-1.5 break-words items-center',
    item: BREADCRUMB_ITEM_CLASS,
    link: '',
    leading: '',
    label: '',
    separator: BREADCRUMB_SEPARATOR_CLASS,
  },
  defaultVariants: {
    size: 'md',
    wrap: true,
  },
  variants: {
    size: {
      sm: {
        link: 'text-xs',
      },
      md: {
        link: 'text-sm',
      },
      lg: {
        link: 'text-base',
      },
    },
    wrap: {
      true: {
        list: 'flex-wrap',
      },
      false: {
        list: 'flex-nowrap overflow-hidden',
      },
    },
  },
})

export const breadcrumbListVariants = recipe({
  base: 'text-sm text-muted-foreground flex gap-1.5 break-words items-center',
  defaultVariants: {
    wrap: true,
  },
  variants: {
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap overflow-hidden',
    },
  },
})

export const breadcrumbSizeVariants = recipe({
  base: '',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
})

export type BreadcrumbVariantProps = VariantProps<typeof breadcrumbRecipe>
