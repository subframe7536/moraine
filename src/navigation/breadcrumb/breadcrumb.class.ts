import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const breadcrumbListVariants = cva('flex items-center', {
  variants: {
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap overflow-hidden',
    },
  },
  defaultVariants: {
    wrap: true,
  },
})

export type BreadcrumbVariantProps = VariantProps<typeof breadcrumbListVariants>
