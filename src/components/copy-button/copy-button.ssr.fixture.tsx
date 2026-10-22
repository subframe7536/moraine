import { renderToString } from 'solid-js/web'

import { CopyButton } from './copy-button'

export function renderCopyButtonFixture(): string {
  return renderToString(() => (
    <>
      <CopyButton value="server-value" />
      <CopyButton value="server-with-children">
        <span>Copy server text</span>
      </CopyButton>
      <CopyButton value="render-prop-server">
        {(state) => (
          <span>
            {state.copied ? 'Copied' : 'Idle'} / {state.isSupported ? 'Supported' : 'Unsupported'}
          </span>
        )}
      </CopyButton>
    </>
  ))
}
