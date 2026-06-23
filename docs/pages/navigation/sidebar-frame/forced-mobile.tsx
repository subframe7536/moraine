import { Button, SidebarFrame } from '@src'

export function ForcedMobile() {
  return (
    <div class="b-1 b-border rounded-xl h-72 overflow-hidden">
      <SidebarFrame
        isMobile
        renderSidebarHeader={() => <div class="text-sm p-3">Mobile Menu</div>}
        renderSidebarBody={(ctx) => (
          <div class="text-sm p-3 h-full overflow-y-auto">
            <p class="text-muted-foreground">This sidebar is rendered inside Sheet.</p>
            <Button classes={{ root: 'mt-3' }} variant="outline" onClick={() => ctx.setOpen(false)}>
              Close
            </Button>
          </div>
        )}
        renderMain={(ctx) => (
          <div class="p-4 flex flex-col gap-3 h-full">
            <h3 class="text-base font-semibold">Forced Mobile Mode</h3>
            <p class="text-sm text-muted-foreground">
              Click the button below to open sidebar sheet via render context.
            </p>
            <Button variant="outline" onClick={ctx.toggle}>
              Toggle Sidebar
            </Button>
          </div>
        )}
      />
    </div>
  )
}
