import type { ClassValue, VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { buttonIconSizeVariants } from '../button/button.class'
import type { ButtonIconSizeProps } from '../button/button.class'

export const badgeVariants = cva(
  'inline-flex max-w-full shrink-0 items-center whitespace-nowrap font-500 select-none',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-accent/50 text-accent-foreground',
        outline: 'bg-background text-foreground ring ring-inset ring-border',
        solid: 'bg-primary text-primary-foreground shadow-xs',
      },
      size: {
        xs: 'rounded-sm px-1 text-xs',
        sm: 'rounded-sm px-1 text-xs',
        md: 'rounded-md px-1.5 text-sm',
        lg: 'rounded-md px-1.5 text-sm',
        xl: 'rounded-lg px-2 text-base',
      },
    },
  },
)

export function badgeIconVariants(
  size: ButtonIconSizeProps['size'],
  cls: ClassValue,
  isLeading: boolean,
) {
  return buttonIconSizeVariants({ size }, 'scale-80', isLeading ? 'me-.5' : 'ms-.5', cls)
}

export type BadgeVariantProps = VariantProps<typeof badgeVariants>
