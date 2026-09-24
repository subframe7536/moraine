import { renderToString } from 'solid-js/web'

import { Resizable } from './resizable'

export function renderResizableFixture(): string {
  return renderToString(() => (
    <Resizable>
      <Resizable.Panel id="navigation">Navigation</Resizable.Panel>
      <Resizable.Handle>Resize</Resizable.Handle>
      <Resizable.Panel>Main content</Resizable.Panel>
    </Resizable>
  ))
}
