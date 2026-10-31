import { renderToString } from 'solid-js/web'

import { Sidebar } from './sidebar'
import { useSidebarContext } from './sidebar-context'

function FixtureContent() {
  const frame = useSidebarContext()

  return (
    <>
      <Sidebar.Panel>
        <Sidebar.Header>
          <span>Header</span>
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel as="h2">Navigation</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton leading="i-lucide:house" href="/home">
                  Home
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton href="/project">Project</Sidebar.MenuButton>
                <Sidebar.MenuAction>
                  <button type="button">Project options</button>
                </Sidebar.MenuAction>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuSub>
                  <Sidebar.MenuSubTrigger leading="i-lucide:folder">Submenu</Sidebar.MenuSubTrigger>
                  <Sidebar.MenuSubContent>
                    <Sidebar.MenuItem>
                      <Sidebar.MenuButton href="/sub-item">Sub Item</Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                  </Sidebar.MenuSubContent>
                </Sidebar.MenuSub>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>
          <span>Footer</span>
        </Sidebar.Footer>
      </Sidebar.Panel>
      <Sidebar.Inset data-open={frame.isOpen() ? '' : undefined}>
        <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        <h1>Main content</h1>
      </Sidebar.Inset>
    </>
  )
}

export function renderSidebarFixture(): string {
  return renderToString(() => (
    <Sidebar panelId="sidebar-fixture">
      <FixtureContent />
    </Sidebar>
  ))
}
