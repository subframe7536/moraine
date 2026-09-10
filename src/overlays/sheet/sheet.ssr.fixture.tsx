import { renderToString } from 'solid-js/web'

import { Sheet } from './sheet'

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
          header={<div data-testid="server-header">Server header</div>}
          action={<div data-testid="server-action">Server action</div>}
          body={<div data-testid="server-body">Server body</div>}
          footer={<div data-testid="server-footer">Server footer</div>}
          close={<span data-testid="server-close-icon">Close</span>}
          ariaLabel="Server sheet"
        />
      </Sheet>
      <Sheet>
        <Sheet.Trigger as="button" type="button">
          Open default sheet
        </Sheet.Trigger>
        <Sheet.Content
          side="right"
          title="Default title"
          description="Default description"
          action={<div data-testid="default-action">Default action</div>}
          body={<div data-testid="default-body">Default body</div>}
          footer={<div data-testid="default-footer">Default footer</div>}
          close={<span data-testid="default-close-icon">Close</span>}
        />
      </Sheet>
    </>
  ))
}
