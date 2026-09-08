import { Icon, Resizable, SidebarFrame, useSidebarFrame } from '@src'
import { Show } from 'solid-js'

function ResizableLayout() {
  const frame = useSidebarFrame()

  return (
    <Show
      when={frame.isMobile()}
      fallback={
        <Resizable class="flex-1 h-full" data-frame-resizable>
          <Resizable.Panel defaultSize="30%" min={160} max={300} collapsible collapsibleMin={52}>
            <SidebarFrame.Sidebar class="max-w-none! w-full!">
              <SidebarFrame.SidebarBody class="p-3">Workspace navigation</SidebarFrame.SidebarBody>
            </SidebarFrame.Sidebar>
          </Resizable.Panel>
          <Resizable.Handle action="collapse">
            {(state) => (
              <Icon
                name={state.collapsed ? 'i-lucide:panel-left-open' : 'i-lucide:panel-left-close'}
              />
            )}
          </Resizable.Handle>
          <Resizable.Panel>
            <SidebarFrame.Main class="p-4">Workspace settings</SidebarFrame.Main>
          </Resizable.Panel>
        </Resizable>
      }
    >
      <SidebarFrame.Sidebar>
        <SidebarFrame.SidebarBody class="p-3">Workspace navigation</SidebarFrame.SidebarBody>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main class="p-4">Workspace settings</SidebarFrame.Main>
    </Show>
  )
}

export function SheetResizableRender() {
  return (
    <div class="border border-border/70 rounded-xl bg-background h-72 w-full overflow-hidden">
      <SidebarFrame>
        <ResizableLayout />
      </SidebarFrame>
    </div>
  )
}
