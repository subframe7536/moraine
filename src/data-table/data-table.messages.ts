export interface DataTableSelectedCountContext {
  selected: number
  total: number
}

export interface DataTableRowCountContext {
  total: number
}

export interface DataTableSortPriorityContext {
  /** One-based position of the column in a multi-column sort. */
  index: number
}

export interface DataTablePageSizeContext {
  size: number
}

export const defaultDataTableMessages = /* @__PURE__ */ Object.freeze({
  empty: 'No results.',
  selectedCount: ({ selected, total }: DataTableSelectedCountContext) =>
    `${selected} of ${total} selected`,
  rowCount: ({ total }: DataTableRowCountContext) => `${total} ${total === 1 ? 'row' : 'rows'}`,
  sort: 'Sort',
  sortedAscending: 'Sorted ascending',
  sortedDescending: 'Sorted descending',
  sortPriority: ({ index }: DataTableSortPriorityContext) => `Sort priority ${index}`,
  selectAll: 'Select all rows',
  selectRow: 'Select row',
  expandRow: 'Expand row',
  collapseRow: 'Collapse row',
  resizeColumn: 'Resize column',
  loading: 'Loading',
  pageSize: ({ size }: DataTablePageSizeContext) => `${size} / page`,
})
