import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const breadcrumbListVariants = cva('flex items-center gap-1.5', {
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

export const breadcrumbLinkVariants = cva(
  'group relative inline-flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium focus-visible:(border-ring ring-3 ring-ring/50) disabled:(cursor-not-allowed opacity-75)',
  {
    variants: {
      active: {
        true: 'text-primary',
        false: 'text-muted',
      },
      clickable: {
        true: 'hover:text-foreground',
        false: '',
      },
      disabled: {
        true: 'hover:text-muted',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
      clickable: false,
      disabled: false,
    },
    compoundVariants: [
      {
        active: false,
        clickable: true,
        disabled: false,
        class: 'transition-colors',
      },
    ],
  },
)

export type BreadcrumbVariantProps = VariantProps<typeof breadcrumbListVariants> &
  VariantProps<typeof breadcrumbLinkVariants>
