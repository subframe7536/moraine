import { renderToString } from 'solid-js/web'

import { createContentRegistration } from '../base/content-registration'

import { Sheet } from './sheet'
import { SheetContentProvider } from './sheet-context'

export function renderSheetFixture(): string {
  return renderToString(() => (
    <>
      <Sheet>
        <Sheet.Trigger as="button" type="button">
          Open custom sheet
        </Sheet.Trigger>
        <Sheet.Content
          side="left"
          inset
          transition={false}
          title="Server title"
          description="Server description"
          close={<span data-testid="server-close-icon">Close</span>}
          ariaLabel="Server sheet"
        >
          <Sheet.Header>
            <div data-testid="server-header">Server header</div>
          </Sheet.Header>
          <Sheet.Body>
            <div data-testid="server-body">Server body</div>
          </Sheet.Body>
          <Sheet.Footer>
            <div data-testid="server-footer">Server footer</div>
          </Sheet.Footer>
        </Sheet.Content>
      </Sheet>
      <Sheet>
        <Sheet.Trigger as="button" type="button">
          Open default sheet
        </Sheet.Trigger>
        <Sheet.Content
          side="right"
          title="Default title"
          description="Default description"
          close={<span data-testid="default-close-icon">Close</span>}
        >
          <Sheet.Body>
            <div data-testid="default-body">Default body</div>
          </Sheet.Body>
          <Sheet.Footer>
            <div data-testid="default-footer">Default footer</div>
          </Sheet.Footer>
        </Sheet.Content>
      </Sheet>
    </>
  ))
}

export function renderPartsFixture(): string {
  return renderToString(() => {
    const registration = createContentRegistration()
    return (
      <Sheet>
        <SheetContentProvider
          value={{
            ...registration,
            variants: { inset: false, side: 'right' },
            hasHeader: registration.hasExplicitHeader,
          }}
        >
          <Sheet.Header>
            <Sheet.Title id="server-sheet-title">Real title</Sheet.Title>
            <Sheet.Description>Details</Sheet.Description>
            <Sheet.Action>Help</Sheet.Action>
          </Sheet.Header>
          <Sheet.Body>Body</Sheet.Body>
          <Sheet.Footer>Actions</Sheet.Footer>
        </SheetContentProvider>
      </Sheet>
    )
  })
}
