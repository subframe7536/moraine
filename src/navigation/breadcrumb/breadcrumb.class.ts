import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const BREADCRUMB_LINK_CLASS =
  'transition-colors hover:text-foreground inline-flex items-center gap-1.5 duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]'
export const BREADCRUMB_PAGE_CLASS = 'text-foreground font-normal inline-flex items-center gap-1'
export const BREADCRUMB_DISABLED_CLASS =
  'aria-disabled:opacity-64 aria-disabled:pointer-events-none'
export const BREADCRUMB_TRUNCATE_CLASS = 'min-w-0 truncate'

export const breadcrumbRecipeOptions = {
  base: {
    root: 'min-w-0 relative',
    list: 'text-sm text-muted-foreground flex gap-1.5 break-words items-center',
    item: 'inline-flex items-center gap-1',
    link: `${BREADCRUMB_LINK_CLASS} ${BREADCRUMB_DISABLED_CLASS}`,
    page: `${BREADCRUMB_PAGE_CLASS} ${BREADCRUMB_DISABLED_CLASS}`,
    leading: '',
    label: '',
    separator: 'text-muted-foreground inline-flex shrink-0 items-center justify-center',
  },
  defaultVariants: {
    size: 'md',
    wrap: true,
  },
  variants: {
    size: {
      sm: {
        link: 'text-xs',
        page: 'text-xs',
      },
      md: {
        link: 'text-sm',
        page: 'text-sm',
      },
      lg: {
        link: 'text-base',
        page: 'text-base',
      },
    },
    wrap: {
      true: {
        list: 'flex-wrap',
      },
      false: {
        list: 'flex-nowrap overflow-hidden',
        link: BREADCRUMB_TRUNCATE_CLASS,
        page: BREADCRUMB_TRUNCATE_CLASS,
        label: BREADCRUMB_TRUNCATE_CLASS,
      },
    },
  },
} as const

export const breadcrumbRecipe = recipe(breadcrumbRecipeOptions)

export type BreadcrumbVariantProps = VariantProps<typeof breadcrumbRecipe>
