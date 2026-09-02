import { renderToString } from 'solid-js/web'

import { Dialog } from './dialog'

export function renderDialogFixture(): string {
  return renderToString(() => (
    <>
      <Dialog
        title="Server title"
        description="Server description"
        header={<div data-testid="server-header">Server header</div>}
        body={<div data-testid="server-body">Server body</div>}
        footer={<div data-testid="server-footer">Server footer</div>}
        closeIcon={<span data-testid="server-close-icon">Close</span>}
        ariaLabel="Server dialog"
      >
        {(props) => (
          <button {...props} type="button">
            Open custom dialog
          </button>
        )}
      </Dialog>
      <Dialog
        title="Default title"
        description="Default description"
        body={<div data-testid="default-body">Default body</div>}
        footer={<div data-testid="default-footer">Default footer</div>}
        closeIcon={<span data-testid="default-close-icon">Close</span>}
      >
        {(props) => (
          <button {...props} type="button">
            Open default dialog
          </button>
        )}
      </Dialog>
    </>
  ))
}
