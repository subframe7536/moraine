import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const breadcrumbListVariants = cva('flex items-center gap-1', {
  variants: {
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
  },
  defaultVariants: {
    wrap: true,
  },
})

export type BreadcrumbVariantProps = VariantProps<typeof breadcrumbListVariants>
