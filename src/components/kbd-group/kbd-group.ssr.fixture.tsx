import { renderToString } from '@solidjs/web'

import { KbdGroup } from './kbd-group'

export function renderKbdGroupFixture(): string {
  return renderToString(() => <KbdGroup items={['meta', 'shift', 'K']} separator="+" />)
}
