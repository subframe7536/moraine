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

export interface SliderThumbContext {
  index: number
  total: number
}

export interface SliderValueTextContext {
  value: number
  index: number
  total: number
}

/** Accessible names for Select. */
export interface SelectMessages {
  /** Accessible name for the clear button. */
  clear: string
  /**
   * Fallback placeholder shown when nothing is selected.
   * An empty string leaves the placeholder unset.
   */
  placeholder: string
}

/** Accessible names shared by Combobox and MultiSelect. */
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
   * MultiSelect uses it for the non-editable trigger name. An empty string leaves the placeholder unset.
   */
  placeholder: string
}

export interface MultiSelectMessages extends CollectionMessages {
  /** Accessible label announced for the overflow tag indicator. */
  overflow: (ctx: { count: number }) => string
  /** Prompt displayed in the empty list state when item creation is enabled. */
  create: (ctx: { value: string }) => string
}

export interface MoraineMessages {
  dialog: { close: string }
  sheet: { close: string }
  breadcrumb: { label: string }
  commandPalette: {
    placeholder: string
    close: string
    empty: string
  }
  select: SelectMessages
  combobox: CollectionMessages
  multiSelect: MultiSelectMessages
  slider: {
    thumb: (ctx: SliderThumbContext) => string
    valueText: (ctx: SliderValueTextContext) => string
  }
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

export interface MoraineMessagesInput {
  dialog?: Partial<MoraineMessages['dialog']>
  sheet?: Partial<MoraineMessages['sheet']>
  breadcrumb?: Partial<MoraineMessages['breadcrumb']>
  commandPalette?: Partial<MoraineMessages['commandPalette']>
  select?: Partial<SelectMessages>
  combobox?: Partial<CollectionMessages>
  multiSelect?: Partial<MultiSelectMessages>
  slider?: Partial<MoraineMessages['slider']>
  pagination?: Partial<MoraineMessages['pagination']>
  inputNumber?: Partial<MoraineMessages['inputNumber']>
  fileUpload?: Partial<MoraineMessages['fileUpload']>
  tagsField?: Partial<MoraineMessages['tagsField']>
  resizable?: Partial<MoraineMessages['resizable']>
  sidebarFrame?: Partial<MoraineMessages['sidebarFrame']>
  form?: Partial<MoraineMessages['form']>
  kbd?: Partial<Record<KbdMessageKey, string>>
}
