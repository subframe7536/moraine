import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const tooltipContentVariants = cva(
  'z-50 max-w-72 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md outline-none',
  {
    defaultVariants: {
      side: 'top',
    },
    variants: {
      side: {
        top: 'data-[expanded]:animate-in data-[closed]:animate-out',
        right: 'data-[expanded]:animate-in data-[closed]:animate-out',
        bottom: 'data-[expanded]:animate-in data-[closed]:animate-out',
        left: 'data-[expanded]:animate-in data-[closed]:animate-out',
      },
    },
  },
)

export const tooltipTextVariants = cva('text-pretty leading-4')

export const tooltipKbdsVariants = cva('ms-1 inline-flex items-center gap-1')

export const tooltipKbdVariants = cva(
  'inline-flex items-center rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none text-muted-foreground uppercase',
)

export const tooltipArrowVariants = cva('fill-popover stroke-border')

export type TooltipVariantProps = VariantProps<typeof tooltipContentVariants>
