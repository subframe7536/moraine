import { renderToString } from 'solid-js/web'

import { Progress } from './progress'

export function renderProgressFixture(): string {
  return renderToString(() => (
    <Progress value={50} textLabel="Upload" valueLabel={({ percent }) => `${percent}%`} />
  ))
}
