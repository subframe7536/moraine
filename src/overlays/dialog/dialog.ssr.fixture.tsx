import { renderToString } from 'solid-js/web'

import { Button } from '../../elements/button/button.tsx'
import { Icon } from '../../elements/icon/icon.tsx'

import { Dialog } from './dialog'

export function renderButtonTriggerFixture(): string {
  return renderToString(() => (
    <Dialog>
      <Dialog.Trigger as={Button} leading="icon-search">
        <Icon name="icon-check" />
        Open
      </Dialog.Trigger>
      <Dialog.Content title="Title">Body</Dialog.Content>
    </Dialog>
  ))
}

export function renderDialogFixture(): string {
  return renderToString(() => (
    <>
      <Dialog>
        <Dialog.Trigger as="button" type="button">
          Open custom dialog
        </Dialog.Trigger>
        <Dialog.Content
          title="Server title"
          description="Server description"
          header={<div data-testid="server-header">Server header</div>}
          body={<div data-testid="server-body">Server body</div>}
          footer={<div data-testid="server-footer">Server footer</div>}
          closeIcon={<span data-testid="server-close-icon">Close</span>}
          ariaLabel="Server dialog"
        />
      </Dialog>
      <Dialog>
        <Dialog.Trigger as="button" type="button">
          Open default dialog
        </Dialog.Trigger>
        <Dialog.Content
          title="Default title"
          description="Default description"
          body={<div data-testid="default-body">Default body</div>}
          footer={<div data-testid="default-footer">Default footer</div>}
          closeIcon={<span data-testid="default-close-icon">Close</span>}
        />
      </Dialog>
    </>
  ))
}
