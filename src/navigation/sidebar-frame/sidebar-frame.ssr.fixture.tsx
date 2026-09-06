import { renderToString } from 'solid-js/web'

import { SidebarFrame } from './sidebar-frame.tsx'

export function renderSidebarFrameFixture(): string {
  return renderToString(() => (
    <SidebarFrame
      sidebarBodyRender={() => <span>Navigation</span>}
      mainRender={() => <h1>Main content</h1>}
    />
  ))
}
