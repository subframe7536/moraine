import { renderToString } from 'solid-js/web'

import { Pagination } from './pagination.tsx'

export function renderPaginationFixture(): string {
  return renderToString(() => (
    <Pagination
      page={5}
      total={100}
      itemsPerPage={10}
      siblingCount={1}
      to={(page) => `#page-${page}`}
    />
  ))
}

export function renderSinglePagePaginationFixture(): string {
  return renderToString(() => <Pagination total={0} itemsPerPage={10} />)
}
