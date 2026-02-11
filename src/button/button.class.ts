import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const buttonVariants = cva(
  "[&_svg]:-mx-0.5 relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-500 text-base outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] focus-visible:effect-fv disabled:(effect-dis cursor-not-allowed) sm:text-sm [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      variant: {
        default:
          'not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-primary bg-primary text-primary-foreground shadow-primary/24 shadow-xs [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [:active,[data-pressed]]:bg-secondary/80 [:hover,[data-pressed]]:bg-secondary/90',
        outline:
          'border-input bg-background text-foreground shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/6%)] dark:bg-input/32 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:bg-accent/50 dark:[:hover,[data-pressed]]:bg-input/64',
        ghost:
          'border-transparent text-foreground data-pressed:bg-accent [:hover,[data-pressed]]:bg-accent',
        link: 'border-transparent underline-offset-4 [:hover,[data-pressed]]:underline',
        destructive:
          'not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-destructive bg-destructive text-destructive-foreground shadow-destructive/24 shadow-xs [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:bg-destructive/90',
        'destructive-outline':
          'border-input bg-transparent text-destructive-foreground shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/6%)] dark:bg-input/32 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:border-destructive/32 [:hover,[data-pressed]]:bg-destructive/4',
      },
      size: {
        default: 'h-9 px-[calc(--spacing(3)-1px)] sm:h-8',
        lg: 'h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9',
        sm: 'h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7',
        xl: 'h-11 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*="size-"])]:size-5 sm:[&_svg:not([class*="size-"])]:size-4.5',
        xs: 'h-7 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-sm before:rounded-[calc(var(--radius-md)-1px)] sm:h-6 sm:text-xs [&_svg:not([class*="size-"])]:size-4 sm:[&_svg:not([class*="size-"])]:size-3.5',
        icon: 'size-9 sm:size-8',
        'icon-lg': 'size-10 sm:size-9',
        'icon-sm': 'size-8 sm:size-7',
        'icon-xl':
          'size-11 sm:size-10 [&_svg:not([class*="size-"])]:size-5 sm:[&_svg:not([class*="size-"])]:size-4.5',
        'icon-xs':
          'size-7 rounded-md before:rounded-[calc(var(--radius-md)-1px)] sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*="size-"])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*="size-"])]:size-3.5',
      },
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
