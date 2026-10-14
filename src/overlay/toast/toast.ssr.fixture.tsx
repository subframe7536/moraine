import { renderToString } from 'solid-js/web'

import { Toast } from './toast'

export function renderToastFixture(): string {
  return renderToString(() => <Toast />)
}
