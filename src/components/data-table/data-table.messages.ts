export interface DataTableSelectedCountContext {
  selected: number
  total: number
}

export interface DataTablePageSizeContext {
  size: number
}

export const defaultDataTableMessages = /* @__PURE__ */ Object.freeze({
  empty: 'No results.',
  selectedCount: ({ selected, total }: DataTableSelectedCountContext) =>
    `${selected} of ${total} row(s) selected.`,
  sort: 'Sort',
  sortedAscending: 'Sorted ascending',
  sortedDescending: 'Sorted descending',
  selectAll: 'Select all rows',
  selectRow: 'Select row',
  expandRow: 'Expand row',
  collapseRow: 'Collapse row',
  pageSize: ({ size }: DataTablePageSizeContext) => `${size} / page`,
})
