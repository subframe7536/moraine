import { renderToString } from '@solidjs/web'

import { Textarea } from './textarea'
export function renderTextareaFixture(): string {
  return renderToString(() => <Textarea id="ssr-textarea" value="Server value" />)
}
