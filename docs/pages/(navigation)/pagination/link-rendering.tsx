import { Pagination } from '@src'

export function LinkRendering() {
  return (
    <div class="flex w-full justify-center">
      <Pagination total={50} itemsPerPage={10} defaultPage={2} siblingCount={1} />
    </div>
  )
}
