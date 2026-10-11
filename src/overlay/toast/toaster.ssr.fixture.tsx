import { renderToString } from 'solid-js/web'

import { Toaster } from './toaster'

export function renderToasterFixture(): string {
  return renderToString(() => <Toaster />)
}
