import type { KBD_KEY_ALIASES } from '../../element/kbd/kbd.types'

export type KbdMessageKey = keyof typeof KBD_KEY_ALIASES

export interface PaginationPageContext {
  page: number
  total: number
}

/** `page` is the destination. It is omitted when the control is already on that edge. */
export interface PaginationStepContext {
  page?: number
}

/** Accessible names shared by Select, Combobox, and MultiSelect. */
export interface CollectionMessages {
  /** Accessible name for the clear button. */
  clear: string
  /** Accessible name for the trigger while options are loading. */
  loading: string
  /** Accessible name for the trigger that opens and closes the list. */
  toggle: string
  /** Text shown when the list has no matching items. */
  empty: string
  /**
   * Fallback placeholder.
   * Select shows it when nothing is selected. MultiSelect uses it for the non-editable
   * trigger name. An empty string leaves the placeholder unset.
   */
  placeholder: string
}

export interface MoraineMessages {
  dialog: { close: string }
  sheet: { close: string }
  commandPalette: {
    placeholder: string
    close: string
    empty: string
  }
  select: CollectionMessages
  combobox: CollectionMessages
  multiSelect: CollectionMessages
  pagination: {
    label: string
    /** Visually hidden live status, for example `Page 1 of 3`. */
    status: (ctx: PaginationPageContext) => string
    page: (ctx: PaginationPageContext) => string
    currentPage: (ctx: PaginationPageContext) => string
    prev: (ctx: PaginationStepContext) => string
    next: (ctx: PaginationStepContext) => string
  }
  inputNumber: {
    increment: string
    decrement: string
  }
  fileUpload: {
    label: string
    remove: (ctx: { name: string }) => string
  }
  tagsField: {
    remove: (ctx: { title: string }) => string
  }
  resizable: {
    expand: string
    collapse: string
  }
  sidebarFrame: { label: string }
  form: { unknownError: string }
  kbd: Record<KbdMessageKey, string>
}

export type MoraineMessagesInput = {
  [Group in keyof MoraineMessages]?: {
    [Key in keyof MoraineMessages[Group]]?: MoraineMessages[Group][Key]
  }
}
