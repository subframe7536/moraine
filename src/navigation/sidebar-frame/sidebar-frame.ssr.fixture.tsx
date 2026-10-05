import { renderToString } from 'solid-js/web'

import { SidebarFrame } from './sidebar-frame'
import { useSidebarFrame } from './sidebar-frame-context'

function FixtureContent() {
  const frame = useSidebarFrame()

  return (
    <>
      <SidebarFrame.Sidebar>
        <SidebarFrame.SidebarHeader>
          <span>Header</span>
        </SidebarFrame.SidebarHeader>
        <SidebarFrame.SidebarBody>
          <SidebarFrame.Group>
            <SidebarFrame.GroupLabel as="h2">Navigation</SidebarFrame.GroupLabel>
            <SidebarFrame.Menu>
              <SidebarFrame.Item leading="i-lucide:house" href="/home">
                Home
              </SidebarFrame.Item>
              <SidebarFrame.Sub label="Submenu" leading="i-lucide:folder">
                <SidebarFrame.Item href="/sub-item">Sub Item</SidebarFrame.Item>
              </SidebarFrame.Sub>
            </SidebarFrame.Menu>
          </SidebarFrame.Group>
        </SidebarFrame.SidebarBody>
        <SidebarFrame.SidebarFooter>
          <span>Footer</span>
        </SidebarFrame.SidebarFooter>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main data-open={frame.isOpen() ? '' : undefined}>
        <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        <h1>Main content</h1>
      </SidebarFrame.Main>
    </>
  )
}

export function renderSidebarFrameFixture(): string {
  return renderToString(() => (
    <SidebarFrame>
      <FixtureContent />
    </SidebarFrame>
  ))
}
