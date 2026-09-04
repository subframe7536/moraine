import { TEXT_SIZE_VARIANT } from '../../shared/recipe-common.class.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const fileUploadRecipe = recipe({
  slots: [
    'root',
    'control',
    'wrapper',
    'icon',
    'label',
    'description',
    'files',
    'file',
    'filePreview',
    'fileMeta',
    'fileName',
    'fileSize',
    'fileRemove',
  ],
  base: {
    root: 'flex flex-col relative data-disabled:opacity-64 data-disabled:pointer-events-none',
    control:
      'text-center outline-none border border-input rounded-lg bg-background inline-flex w-full cursor-pointer shadow-xs transition-[colors,box-shadow] items-center justify-center relative focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-dragging:border-primary data-dragging:bg-primary/8 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 dark:bg-input/30',
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
        control: 'text-xs px-3 py-2.5 gap-2 min-h-24',
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
        control: 'text-sm px-4 py-3 gap-2 min-h-28',
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
        control: 'text-sm px-4.5 py-3.5 gap-2.5 min-h-32',
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

export const fileUploadRootVariants = recipe({
  base: 'flex flex-col relative data-disabled:opacity-64 data-disabled:pointer-events-none',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'gap-2',
      md: 'gap-2.5',
      lg: 'gap-3',
    },
  },
})

export const fileUploadBaseVariants = recipe({
  base: 'text-center outline-none border border-input rounded-lg bg-background inline-flex w-full cursor-pointer shadow-xs transition-[colors,box-shadow] items-center justify-center relative focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-dragging:border-primary data-dragging:bg-primary/8 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 dark:bg-input/30',
  defaultVariants: {
    size: 'md',
    dropzone: true,
  },
  variants: {
    size: {
      sm: 'text-xs px-3 py-2.5 gap-2 min-h-24',
      md: 'text-sm px-4 py-3 gap-2 min-h-28',
      lg: 'text-sm px-4.5 py-3.5 gap-2.5 min-h-32',
    },
    dropzone: {
      true: 'border-dashed',
      false: 'border-solid',
    },
  },
})

export const fileUploadWrapperVariants = recipe({
  base: 'text-center flex flex-col pointer-events-none items-center justify-center',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'gap-0.5',
      md: 'gap-1',
      lg: 'gap-1',
    },
  },
})

export const fileUploadIconVariants = recipe({
  base: 'text-muted-foreground',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
    },
  },
})

export const fileUploadLabelVariants = recipe({
  base: 'text-foreground font-medium',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
  },
})

export const fileUploadDescriptionVariants = recipe({
  base: 'text-muted-foreground',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
  },
})

export const fileUploadFilesVariants = recipe({
  base: 'flex flex-col',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-2',
    },
  },
})

export const fileUploadFileVariants = recipe({
  base: 'text-card-foreground border border-border rounded-xl bg-card flex transition-colors items-center relative',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'px-2.5 py-2 gap-1.5',
      md: 'px-2.5 py-2 gap-2',
      lg: 'px-3 py-2.5 gap-2.5',
    },
  },
})

export const fileUploadPreviewVariants = recipe({
  base: 'text-muted-foreground rounded-lg bg-muted flex shrink-0 items-center justify-center relative overflow-hidden',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'size-8.5',
      md: 'size-10',
      lg: 'size-10',
    },
  },
})

export const fileUploadMetaVariants = recipe({
  base: 'flex flex-1 flex-col min-w-0',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'gap-0.5',
      md: 'gap-0.5',
      lg: 'gap-1',
    },
  },
})

export const fileUploadNameVariants = recipe({
  base: 'text-foreground font-medium truncate',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
  },
})

export const fileUploadSizeVariants = recipe({
  base: 'text-muted-foreground mt-0.5 truncate',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-xs',
    },
  },
})

export const fileUploadRemoveVariants = recipe({
  base: 'text-muted-foreground border border-transparent rounded-sm inline-flex transition-colors items-center justify-center hover:text-foreground hover:bg-muted-hover focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted-active',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-xs size-5',
      md: 'text-sm size-6',
      lg: 'text-sm size-6.5',
    },
  },
})

export type FileUploadVariantProps = VariantProps<typeof fileUploadRecipe>
