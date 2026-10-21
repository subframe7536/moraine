import { renderToString } from 'solid-js/web'

import { Progress } from './progress'

export function renderProgressFixture(): string {
  return renderToString(() => (
    <Progress
      value={50}
      label="Upload"
      valueRender={(context) => <span>{context.percent}%</span>}
    />
  ))
}
