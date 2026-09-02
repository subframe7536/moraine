import { renderToString } from 'solid-js/web'

import { Textarea } from './textarea'

export function renderTextareaFixture(): string {
  return renderToString(() => (
    <Textarea id="ssr-textarea" value="Server value" header={0} footer="Footer">
      <span data-testid="child">Child</span>
    </Textarea>
  ))
}
