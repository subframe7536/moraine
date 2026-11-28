import { renderToString } from '@solidjs/web'

import { Pagination } from './pagination'
export function renderPaginationFixture(): string {
  return renderToString(() => (
    <Pagination
      page={5}
      total={100}
      pageSize={10}
      siblingCount={1}
      getPageHref={(page) => `#page-${page}`}
    />
  ))
}

export function renderSinglePagePaginationFixture(): string {
  return renderToString(() => <Pagination total={0} pageSize={10} />)
}
