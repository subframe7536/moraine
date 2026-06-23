import { Pagination } from '@src'

export function Variants() {
  return (
    <Pagination
      total={60}
      itemsPerPage={10}
      to={(nextPage) => `#pagination&page=${nextPage}`}
      variant="outline"
      activeVariant="default"
      controlVariant="secondary"
    />
  )
}
