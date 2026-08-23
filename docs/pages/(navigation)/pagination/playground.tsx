import { Pagination } from '@src'
import type { PaginationT } from '@src'
import { createSignal } from 'solid-js'

export interface PaginationPlaygroundProps {
  size?: PaginationT.Variant['size']
  itemsPerPage?: number
  showControls?: boolean
}

export function PaginationPlayground(props: PaginationPlaygroundProps) {
  const [page, setPage] = createSignal(1)

  return (
    <div class="flex flex-col gap-3 items-center">
      <Pagination
        total={100}
        page={page()}
        onPageChange={setPage}
        itemsPerPage={props.itemsPerPage ?? 10}
        size={props.size ?? 'md'}
        showControls={props.showControls ?? true}
      />
      <span class="text-xs text-muted-foreground font-mono">Current Page: {page()} of 10</span>
    </div>
  )
}
