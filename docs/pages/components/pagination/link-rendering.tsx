import { useSearchParams } from '@solidjs/router'
import { Pagination } from '@src'
import type { PaginationT } from '@src'
import { Show, createMemo } from 'solid-js'
// The current page has no destination, so it keeps a plain anchor instead of a router link.
function RouterLink(props: PaginationT.ItemRenderProps) {
  return (
    <Show when={props.href} fallback={<a {...props} />}>
      {(href) => <a {...props} href={href()} />}
    </Show>
  )
}

export function LinkRendering() {
  const [params] = useSearchParams()
  const page = createMemo(() => {
    const requested = Number(params.page)
    return Number.isFinite(requested) ? Math.min(5, Math.max(1, Math.trunc(requested))) : 1
  })
  return (
    <div class="flex w-full justify-center">
      <Pagination
        itemRender={RouterLink}
        controlRender={RouterLink}
        total={50}
        pageSize={10}
        page={page()}
        siblingCount={1}
        getPageHref={(page) => `/pagination?page=${page}`}
      />
    </div>
  )
}
