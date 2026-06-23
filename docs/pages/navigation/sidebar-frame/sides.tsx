import { SidebarFrame } from '@src'

export function Sides() {
  return (
    <div class="gap-3 grid w-full md:grid-cols-2">
      <div class="b-1 b-border rounded-xl h-64 w-full overflow-hidden">
        <SidebarFrame
          isMobile={false}
          side="left"
          renderSidebarHeader={() => <div class="text-xs p-3">side=left</div>}
          renderSidebarBody={() => (
            <div class="text-sm text-muted-foreground p-2 h-full">Sidebar panel (left)</div>
          )}
          renderMain={() => <div class="text-sm p-3 h-full">Main panel</div>}
        />
      </div>
      <div class="b-1 b-border rounded-xl h-64 w-full overflow-hidden">
        <SidebarFrame
          isMobile={false}
          side="right"
          renderSidebarHeader={() => <div class="text-xs p-3">side=right</div>}
          renderSidebarBody={() => (
            <div class="text-sm text-muted-foreground p-2 h-full">Sidebar panel (right)</div>
          )}
          renderMain={() => <div class="text-sm p-3 h-full">Main panel</div>}
        />
      </div>
    </div>
  )
}
