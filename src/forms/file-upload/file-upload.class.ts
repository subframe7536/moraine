import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const fileUploadRecipe = recipe({
  base: {
    root: 'flex flex-col relative data-disabled:opacity-64 data-disabled:pointer-events-none',
    control:
      'text-center outline-none border border-input rounded-lg bg-background inline-flex w-full cursor-pointer shadow-xs transition-[colors,box-shadow] items-center justify-center relative focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-dragging:border-primary data-dragging:bg-input data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 dark:bg-input/30 hover:bg-input',
    wrapper: 'text-center flex flex-col pointer-events-none items-center justify-center',
    icon: 'text-muted-foreground',
    label: 'text-foreground font-medium',
    description: 'text-muted-foreground',
    files: 'flex flex-col',
    file: 'text-card-foreground border border-border rounded-xl bg-card flex transition-colors items-center relative',
    filePreview:
      'text-muted-foreground rounded-lg bg-muted flex shrink-0 items-center justify-center relative overflow-hidden',
    fileMeta: 'flex flex-1 flex-col min-w-0',
    fileName: 'text-foreground font-medium truncate',
    fileSize: 'text-muted-foreground mt-0.5 truncate',
    fileRemove:
      'text-muted-foreground border border-transparent rounded-sm inline-flex transition-colors items-center justify-center hover:text-foreground hover:bg-muted-hover focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted-active',
  },
  defaultVariants: {
    size: 'md',
    dropzone: true,
  },
  variants: {
    size: {
      sm: {
        root: 'gap-2',
        control: 'text-xs px-4 gap-2 min-h-24',
        wrapper: 'gap-0.5',
        icon: 'text-lg',
        label: 'text-xs',
        description: 'text-xs',
        files: 'gap-1.5',
        file: 'px-2.5 py-2 gap-1.5',
        filePreview: 'size-8.5',
        fileMeta: 'gap-0.5',
        fileName: 'text-xs',
        fileSize: 'text-xs',
        fileRemove: 'text-xs size-5',
      },
      md: {
        root: 'gap-2.5',
        control: 'text-sm px-5 gap-2 min-h-28',
        wrapper: 'gap-1',
        icon: 'text-xl',
        label: 'text-sm',
        description: 'text-sm',
        files: 'gap-2',
        file: 'px-2.5 py-2 gap-2',
        filePreview: 'size-10',
        fileMeta: 'gap-0.5',
        fileName: 'text-sm',
        fileSize: 'text-xs',
        fileRemove: 'text-sm size-6',
      },
      lg: {
        root: 'gap-3',
        control: 'text-sm px-6 gap-2.5 min-h-32',
        wrapper: 'gap-1',
        icon: 'text-2xl',
        label: 'text-base',
        description: 'text-base',
        files: 'gap-2',
        file: 'px-3 py-2.5 gap-2.5',
        filePreview: 'size-10',
        fileMeta: 'gap-1',
        fileName: 'text-base',
        fileSize: 'text-xs',
        fileRemove: 'text-sm size-6.5',
      },
    },
    dropzone: {
      true: { control: 'border-dashed' },
      false: { control: 'border-solid' },
    },
  },
})

export type FileUploadVariantProps = VariantProps<typeof fileUploadRecipe>
