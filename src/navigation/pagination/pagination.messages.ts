import type { MoraineMessages } from '../../provider/locale/messages.types'

export const defaultPaginationMessages: MoraineMessages['pagination'] =
  /* @__PURE__ */ Object.freeze({
    label: 'Pagination',
    status: ({ page, total }) => `Page ${page} of ${total}`,
    page: ({ page, total }) => `Go to page ${page} of ${total}`,
    currentPage: ({ page, total }) => `Page ${page} of ${total}, current page`,
    prev: ({ page }) =>
      page === undefined ? 'Go to previous page' : `Go to previous page, page ${page}`,
    next: ({ page }) => (page === undefined ? 'Go to next page' : `Go to next page, page ${page}`),
  })
