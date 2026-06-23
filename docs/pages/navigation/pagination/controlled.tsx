import { Pagination } from '@src'
import { createSignal } from 'solid-js'

export function Controlled() {
  const [page, setPage] = createSignal(3)

  return (
    <div class="space-y-3">
      <Pagination
        page={page()}
        onPageChange={setPage}
        total={120}
        itemsPerPage={10}
        siblingCount={1}
        prevText="Previous"
        nextText="Next"
      />
      <p class="text-xs text-muted-foreground">Current page: {page()}</p>
    </div>
  )
}
