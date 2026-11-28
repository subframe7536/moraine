import { renderToString } from '@solidjs/web'

import { Progress } from './progress'
export function renderProgressFixture(): string {
  return renderToString(() => (
    <Progress value={50} label="Upload" valueLabel={({ percent }) => `${percent}%`} />
  ))
}
