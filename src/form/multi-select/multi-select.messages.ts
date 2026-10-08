import type { MultiSelectMessages } from '../../provider/locale/messages.types'

export const defaultMultiSelectMessages: MultiSelectMessages =
  /* @__PURE__ */ Object.freeze<MultiSelectMessages>({
    clear: 'Clear selection',
    loading: 'Loading',
    toggle: 'Toggle options',
    empty: 'No items',
    placeholder: 'Select options',
    overflow: ({ count }) => `${count} additional selections`,
    create: ({ value }) => `Press Enter to create “${value}”`,
  })
