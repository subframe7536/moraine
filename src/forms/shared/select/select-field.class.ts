export const FIELD_CONTROL_CLASS =
  'relative text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-editable:focus-within:(outline-none border-ring ring-3 ring-ring/50) data-editable:focus-within:data-invalid:(border-destructive ring-destructive/20) data-invalid:(border-destructive ring-3 ring-destructive/20) data-disabled:(opacity-64 pointer-events-none) dark:data-editable:focus-within:data-invalid:(border-destructive/50 ring-destructive/40) dark:data-invalid:(border-destructive/50 ring-destructive/40)'

export const FIELD_INPUT_CLASS =
  'outline-none bg-transparent flex-1 w-full disabled:(opacity-64 pointer-events-none) read-only:cursor-pointer'

export const SELECT_LOADING_ICON_CLASS = 'data-loading:animate-spin'

export const SELECT_TRIGGER_FOCUS_CLASS =
  "focus-visible:after:(content-[''] pointer-events-none absolute inset-0 z-10 rounded-md border border-ring ring-3 ring-ring/50) focus-visible:data-invalid:after:(border-destructive ring-destructive/20) dark:focus-visible:data-invalid:after:(border-destructive/50 ring-destructive/40)"

export const PRIMARY_TRIGGER_CLASS =
  'static outline-none bg-transparent flex flex-1 gap-1.5 min-w-0 cursor-pointer items-center text-start disabled:pointer-events-none'

const SELECT_FIELD_ACTION_CLASS =
  'text-muted-foreground opacity-80 p-0.5 rounded-xs inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors hover:(bg-muted-hover text-foreground opacity-100) active:bg-muted-active disabled:pointer-events-none'

export const SECONDARY_TRIGGER_CLASS = `${SELECT_FIELD_ACTION_CLASS} static outline-none data-loading:cursor-wait`

export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'
export const SELECT_CLEAR_ACTION_CLASS = `${SELECT_FIELD_ACTION_CLASS} select-none`

export const TAG_FIELD_CONTROL_CLASS = `${FIELD_CONTROL_CLASS} data-tags:ps-1`
export const TAG_FIELD_INPUT_CLASS = `${FIELD_INPUT_CLASS} min-w-12 py-0.5 data-duplicate:text-destructive`
