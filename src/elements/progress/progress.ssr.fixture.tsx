import { renderToString } from 'solid-js/web'

import { Progress } from './progress.tsx'

const STEPS = ['Waiting', 'Working', 'Done']

export function renderProgressFixture(): string {
  return renderToString(() => (
    <Progress
      value={1}
      max={STEPS}
      statusRender={(context) => <span>{context.percent}%</span>}
      stepRender={(context) => <span>{context.step}</span>}
    />
  ))
}
