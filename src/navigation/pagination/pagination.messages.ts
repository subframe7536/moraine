export interface PaginationPageContext {
  page: number
  total: number
}

/** `page` is the destination. It is omitted when the control is already on that edge. */
export interface PaginationStepContext {
  page?: number
}

export const defaultPaginationMessages = /* @__PURE__ */ Object.freeze({
  label: 'Pagination',
  status: ({ page, total }: PaginationPageContext) => `Page ${page} of ${total}`,
  page: ({ page, total }: PaginationPageContext) => `Go to page ${page} of ${total}`,
  currentPage: ({ page, total }: PaginationPageContext) => `Page ${page} of ${total}, current page`,
  prev: ({ page }: PaginationStepContext) =>
    page === undefined ? 'Go to previous page' : `Go to previous page, page ${page}`,
  next: ({ page }: PaginationStepContext) =>
    page === undefined ? 'Go to next page' : `Go to next page, page ${page}`,
})
