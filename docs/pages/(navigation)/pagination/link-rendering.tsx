import { useSearchParams } from '@solidjs/router'
import { Pagination } from '@src'
import { createMemo } from 'solid-js'

export function LinkRendering() {
  const [params] = useSearchParams()
  const page = createMemo(() => {
    const requested = Number(params.page)
    return Number.isFinite(requested) ? Math.min(5, Math.max(1, Math.trunc(requested))) : 1
  })
  return (
    <div class="flex w-full justify-center">
      <Pagination
        total={50}
        itemsPerPage={10}
        page={page()}
        siblingCount={1}
        to={(page) => `/pagination?page=${page}`}
      />
    </div>
  )
}
