import { Button, SidebarFrame, useSidebarFrame } from '@src'

function MobileLayout() {
  const frame = useSidebarFrame()

  return (
    <>
      <SidebarFrame.Sidebar>
        <SidebarFrame.SidebarHeader class="p-3 border-b border-border/60">
          Mobile App
        </SidebarFrame.SidebarHeader>
        <SidebarFrame.SidebarBody class="p-3">Navigation</SidebarFrame.SidebarBody>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main class="p-4">
        <Button size="sm" variant="outline" onClick={frame.toggle}>
          Open menu
        </Button>
      </SidebarFrame.Main>
    </>
  )
}

export function ForcedMobile() {
  return (
    <div class="mx-auto border border-border/70 rounded-xl bg-background h-72 max-w-sm w-full overflow-hidden">
      <SidebarFrame isMobile>
        <MobileLayout />
      </SidebarFrame>
    </div>
  )
}
