import { renderToString } from '@solidjs/web'
import { merge } from 'solid-js'

import { createContentAnatomy } from '../shared/overlay/content-anatomy'

import { Sheet } from './sheet'
import { SheetProvider, useSheetContext } from './sheet-context'
export function renderSheetFixture(): string {
  return renderToString(() => (
    <>
      <Sheet
        side="left"
        inset
        transition={false}

        closeIcon={<span data-testid="server-close-icon">Close</span>}
      >
        <Sheet.Trigger as="button" type="button">
          Open custom sheet
        </Sheet.Trigger>
        <Sheet.Content
          aria-label="Server sheet"
          title="Server title"
          description="Server description"
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
      <Sheet
        side="right"

        closeIcon={<span data-testid="default-close-icon">Close</span>}
      >
        <Sheet.Trigger as="button" type="button">
          Open default sheet
        </Sheet.Trigger>
        <Sheet.Content title="Default title" description="Default description">
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

function PartsWithContent() {
  const sheet = useSheetContext()
  const registration = createContentAnatomy()
  const value = merge(sheet, {
    content: {
      ...registration,
      variants: { inset: false, side: 'right' as const },
    },
  })
  return (
    <SheetProvider value={value}>
      <Sheet.Header>
        <Sheet.Title id="server-sheet-title">Real title</Sheet.Title>
        <Sheet.Description>Details</Sheet.Description>
      </Sheet.Header>
      <Sheet.Body>Body</Sheet.Body>
      <Sheet.Footer>Actions</Sheet.Footer>
    </SheetProvider>
  )
}

export function renderPartsFixture(): string {
  return renderToString(() => (
    <Sheet>
      <PartsWithContent />
    </Sheet>
  ))
}
