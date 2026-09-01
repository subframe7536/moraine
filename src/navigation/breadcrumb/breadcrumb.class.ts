import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const BREADCRUMB_ROOT_CLASS = 'min-w-0 relative'
export const BREADCRUMB_ITEM_CLASS = 'inline-flex items-center gap-1'
export const BREADCRUMB_LINK_CLASS =
  'transition-colors hover:text-foreground inline-flex items-center gap-1.5'
export const BREADCRUMB_PAGE_CLASS = 'text-foreground font-normal inline-flex items-center gap-1'
export const BREADCRUMB_DISABLED_CLASS = 'aria-disabled:effect-dis'
export const BREADCRUMB_TRUNCATE_CLASS = 'min-w-0 truncate'
export const BREADCRUMB_SEPARATOR_CLASS =
  'text-muted-foreground inline-flex shrink-0 items-center justify-center'

export const BREADCRUMB_LIST_CLASS =
  'text-sm text-muted-foreground flex gap-1.5 break-words items-center'

export const breadcrumbSizeVariants = cva('', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export type BreadcrumbVariantProps = VariantProps<typeof breadcrumbSizeVariants> & {
  wrap?: boolean
}
