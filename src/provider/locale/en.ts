import type { MoraineMessages } from './messages.types'

function pack<T extends object>(value: T): T {
  return Object.freeze(value)
}

const collection = pack({
  clear: 'Clear selection',
  loading: 'Loading',
  toggle: 'Toggle options',
  empty: 'No items',
  placeholder: '',
})

/** Built-in English copy. Component output matches these strings when no locale pack is set. */
export const enMessages: MoraineMessages = /* @__PURE__ */ pack({
  dialog: pack({ close: 'Close' }),
  sheet: pack({ close: 'Close' }),
  commandPalette: pack({
    placeholder: 'Search...',
    close: 'Close',
    empty: 'No results.',
  }),
  select: collection,
  combobox: collection,
  multiSelect: pack({
    clear: 'Clear selection',
    loading: 'Loading',
    toggle: 'Toggle options',
    empty: 'No items',
    placeholder: 'Select options',
  }),
  pagination: pack({
    label: 'Pagination',
    status: ({ page, total }) => `Page ${page} of ${total}`,
    page: ({ page, total }) => `Go to page ${page} of ${total}`,
    currentPage: ({ page, total }) => `Page ${page} of ${total}, current page`,
    prev: ({ page }) =>
      page === undefined ? 'Go to previous page' : `Go to previous page, page ${page}`,
    next: ({ page }) => (page === undefined ? 'Go to next page' : `Go to next page, page ${page}`),
  }),
  inputNumber: pack({
    increment: 'Increment',
    decrement: 'Decrement',
  }),
  fileUpload: pack({
    label: 'File upload',
    remove: ({ name }) => `Remove ${name}`,
  }),
  tagsField: pack({
    remove: ({ title }) => `Remove ${title}`,
  }),
  resizable: pack({
    expand: 'Expand panel',
    collapse: 'Collapse panel',
  }),
  sidebarFrame: pack({ label: 'Sidebar navigation' }),
  form: pack({ unknownError: 'An unknown error has occurred.' }),
  kbd: pack({
    alt: 'Alt',
    arrowdown: 'Arrow Down',
    arrowleft: 'Arrow Left',
    arrowright: 'Arrow Right',
    arrowup: 'Arrow Up',
    backspace: 'Backspace',
    capslock: 'Caps Lock',
    command: 'Command',
    control: 'Control',
    ctrl: 'Control',
    delete: 'Delete',
    end: 'End',
    enter: 'Enter',
    escape: 'Escape',
    home: 'Home',
    meta: 'Meta',
    option: 'Option',
    pagedown: 'Page Down',
    pageup: 'Page Up',
    shift: 'Shift',
    tab: 'Tab',
    win: 'Windows',
  }),
})
