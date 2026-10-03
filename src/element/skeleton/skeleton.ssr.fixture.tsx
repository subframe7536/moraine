import { renderToString } from 'solid-js/web'

import { Skeleton } from './skeleton'

export function renderSkeletonFixture(): string {
  return renderToString(() => (
    <Skeleton id="loading-placeholder" class="rounded-full h-4 w-24" style={{ width: '100px' }}>
      <span>Loading</span>
    </Skeleton>
  ))
}
