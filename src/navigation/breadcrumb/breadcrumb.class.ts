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

export const breadcrumbListVariants = cva(
  'text-sm text-muted-foreground flex gap-1.5 break-words items-center',
  {
    variants: {
      wrap: {
        true: 'flex-wrap',
        false: 'flex-nowrap overflow-hidden',
      },
    },
    defaultVariants: {
      wrap: true,
    },
  },
)

export const breadcrumbSizeVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: '',
      lg: 'text-base',
      xl: 'text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

type BreadcrumbSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const BREADCRUMB_ICON_SIZES: Record<BreadcrumbSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
}

export type BreadcrumbVariantProps = VariantProps<typeof breadcrumbListVariants>
