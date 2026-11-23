import { renderToString } from '@solidjs/web'

import { Toast } from './toast'
export function renderToastFixture(): string {
  return renderToString(() => <Toast />)
}
