import { Pagination } from '@src'

export function Minimal() {
  return <Pagination total={120} itemsPerPage={10} showControls={false} />
}
