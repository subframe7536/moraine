export interface PaginationPageContext {
  /** Page the message describes (1-indexed). */
  page: number
  /** Number of pages. */
  pageCount: number
}

/** `page` is the destination. It is omitted when the control is already on that edge. */
export interface PaginationStepContext {
  page?: number
}

export const defaultPaginationMessages = /* @__PURE__ */ Object.freeze({
  label: 'Pagination',
  status: ({ page, pageCount }: PaginationPageContext) => `Page ${page} of ${pageCount}`,
  page: ({ page, pageCount }: PaginationPageContext) => `Go to page ${page} of ${pageCount}`,
  currentPage: ({ page, pageCount }: PaginationPageContext) =>
    `Page ${page} of ${pageCount}, current page`,
  prev: ({ page }: PaginationStepContext) =>
    page === undefined ? 'Go to previous page' : `Go to previous page, page ${page}`,
  next: ({ page }: PaginationStepContext) =>
    page === undefined ? 'Go to next page' : `Go to next page, page ${page}`,
})
