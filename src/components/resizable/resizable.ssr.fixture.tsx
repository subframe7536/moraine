import { renderToString } from '@solidjs/web'
import { Show } from 'solid-js'

import { Resizable } from './resizable'
export function renderResizableFixture(): string {
  return renderToString(() => (
    <Resizable defaultValue={{ a: 30 }}>
      <Resizable.Panel id="a">Navigation</Resizable.Panel>
      <Resizable.Handle>Resize</Resizable.Handle>
      <Resizable.Panel id="b">Main content</Resizable.Panel>
    </Resizable>
  ))
}

export function renderResizableShowHandleFixture(): string {
  // A dynamic `when` keeps the `<!--$-->` boundary markers a client `Show` needs to hydrate.
  const shown = () => true
  return renderToString(() => (
    <Resizable>
      <Resizable.Panel>Navigation</Resizable.Panel>
      <Resizable.Handle>
        <Show when={shown()}>Resize</Show>
      </Resizable.Handle>
      <Resizable.Panel>Main content</Resizable.Panel>
    </Resizable>
  ))
}

export function renderResizableCollapsedFixture(): string {
  return renderToString(() => (
    <Resizable defaultValue={{ a: 0, b: 100 }}>
      <Resizable.Panel id="a" collapsible min={20}>
        Navigation
      </Resizable.Panel>
      <Resizable.Handle>Resize</Resizable.Handle>
      <Resizable.Panel id="b">Main content</Resizable.Panel>
    </Resizable>
  ))
}
