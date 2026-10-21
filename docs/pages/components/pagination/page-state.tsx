import { Pagination } from '@src'
import { createSignal } from 'solid-js'

export function PageState() {
  const [page, setPage] = createSignal(1)

  return (
    <div class="flex flex-col gap-3 items-center">
      <Pagination total={100} itemsPerPage={10} page={page()} onPageChange={setPage} />
      <p class="text-xs text-muted-foreground">
        Active page: <span class="text-foreground font-medium">{page()}</span> of 10
      </p>
    </div>
  )
}
