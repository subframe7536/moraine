export const defaultMultiSelectMessages = /* @__PURE__ */ Object.freeze({
  clear: 'Clear selection',
  loading: 'Loading',
  toggle: 'Toggle options',
  empty: 'No items',
  placeholder: 'Select options',
  overflow: ({ count }: { count: number }) => `${count} additional selections`,
  create: ({ value }: { value: string }) => `Press Enter to create “${value}”`,
})
