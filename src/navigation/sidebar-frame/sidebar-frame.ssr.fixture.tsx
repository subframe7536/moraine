import { renderToString } from 'solid-js/web'

import { useSidebarFrame } from './sidebar-frame-context.ts'
import { SidebarFrame } from './sidebar-frame.tsx'

function FixtureContent() {
  const frame = useSidebarFrame()

  return (
    <>
      <SidebarFrame.Sidebar>
        <SidebarFrame.SidebarBody>
          <span>Navigation</span>
        </SidebarFrame.SidebarBody>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main data-open={frame.isOpen() ? '' : undefined}>
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
