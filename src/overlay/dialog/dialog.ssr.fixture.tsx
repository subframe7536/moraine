import { renderToString } from 'solid-js/web'

import { Button } from '../../element/button/button'
import { Icon } from '../../element/icon/icon'

import { Dialog } from './dialog'
import { DialogContentProvider, createDialogContentRegistration } from './dialog-context'

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
          closeIcon={<span data-testid="server-close-icon">Close</span>}
          ariaLabel="Server dialog"
        >
          <Dialog.Header>
            <div data-testid="server-header">Server header</div>
          </Dialog.Header>
          <Dialog.Body>
            <div data-testid="server-body">Server body</div>
          </Dialog.Body>
          <Dialog.Footer>
            <div data-testid="server-footer">Server footer</div>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
      <Dialog>
        <Dialog.Trigger as="button" type="button">
          Open default dialog
        </Dialog.Trigger>
        <Dialog.Content
          title="Default title"
          description="Default description"
          closeIcon={<span data-testid="default-close-icon">Close</span>}
        >
          <Dialog.Body>
            <div data-testid="default-body">Default body</div>
          </Dialog.Body>
          <Dialog.Footer>
            <div data-testid="default-footer">Default footer</div>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  ))
}

export function renderPartsFixture(): string {
  return renderToString(() => {
    const registration = createDialogContentRegistration()
    return (
      <Dialog>
        <DialogContentProvider
          value={{
            ...registration,
            variants: { fullscreen: false, scrollable: false },
            overlayScroll: () => false,
            hasHeader: registration.hasExplicitHeader,
          }}
        >
          <Dialog.Header>
            <Dialog.Title id="server-dialog-title">Real title</Dialog.Title>
            <Dialog.Description>Details</Dialog.Description>
            <Dialog.Action>Help</Dialog.Action>
          </Dialog.Header>
          <Dialog.Body>Body</Dialog.Body>
          <Dialog.Footer>Actions</Dialog.Footer>
        </DialogContentProvider>
      </Dialog>
    )
  })
}
