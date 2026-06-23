import { Pagination } from '@src'

export function Minimal() {
  return <Pagination total={80} itemsPerPage={10} showControls={false} />
}
