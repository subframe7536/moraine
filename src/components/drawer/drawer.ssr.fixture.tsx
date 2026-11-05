import { renderToString } from 'solid-js/web'

import { createContentAnatomy } from '../shared/overlay/content-anatomy'

import { Drawer } from './drawer'
import { DrawerContentProvider } from './drawer-context'

export function renderDrawerFixture(): string {
  return renderToString(() => (
    <>
      <Drawer
        side="top"
        closable

        closeIcon={<span data-testid="server-close-icon">Close</span>}
      >
        <Drawer.Trigger as="button" type="button">
          Open custom drawer
        </Drawer.Trigger>
        <Drawer.Content
          aria-label="Server drawer"
          title="Server title"
          description="Server description"
        >
          <Drawer.Header>
            <div data-testid="server-header">Server header</div>
          </Drawer.Header>
          <Drawer.Body>
            <div data-testid="server-body">Server body</div>
          </Drawer.Body>
          <Drawer.Footer>
            <div data-testid="server-footer">Server footer</div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
      <Drawer closeIcon={<span data-testid="default-close-icon">Close</span>}>
        <Drawer.Trigger as="button" type="button">
          Open default drawer
        </Drawer.Trigger>
        <Drawer.Content title="Default title" description="Default description">
          <Drawer.Body>
            <div data-testid="default-body">Default body</div>
          </Drawer.Body>
          <Drawer.Footer>
            <div data-testid="default-footer">Default footer</div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  ))
}

export function renderPartsFixture(): string {
  return renderToString(() => {
    const registration = createContentAnatomy()
    return (
      <Drawer>
        <DrawerContentProvider
          value={{
            ...registration,
            variants: { side: 'bottom' },
          }}
        >
          <Drawer.Header>
            <Drawer.Title id="server-drawer-title">Real title</Drawer.Title>
            <Drawer.Description>Details</Drawer.Description>
          </Drawer.Header>
          <Drawer.Body>Body</Drawer.Body>
          <Drawer.Footer>Actions</Drawer.Footer>
        </DrawerContentProvider>
      </Drawer>
    )
  })
}
