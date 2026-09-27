import { Avatar, Badge, Button, DropdownMenu, Icon, SidebarFrame } from '@src'
import { For, createSignal } from 'solid-js'

export function HeaderFooterSlots() {
  const [currentTeam, setCurrentTeam] = createSignal('Acme Corp')
  const [currentProject, setCurrentProject] = createSignal('Core Engine v2')

  const teamItems = [
    {
      label: 'Acme Corp',
      icon: 'i-lucide:building-2',
      onSelect: () => setCurrentTeam('Acme Corp'),
    },
    {
      label: 'Acme Labs',
      icon: 'i-lucide:flask-conical',
      onSelect: () => setCurrentTeam('Acme Labs'),
    },
    {
      label: 'Personal Space',
      icon: 'i-lucide:user',
      onSelect: () => setCurrentTeam('Personal Space'),
    },
    { type: 'separator' as const },
    {
      label: 'Add Workspace',
      icon: 'i-lucide:plus',
      onSelect: () => {},
    },
  ]

  const userItems = [
    { label: 'Account Settings', icon: 'i-lucide:settings' },
    { label: 'Billing & Invoices', icon: 'i-lucide:credit-card' },
    { label: 'Notifications', icon: 'i-lucide:bell' },
    { type: 'separator' as const },
    { label: 'Log out', icon: 'i-lucide:log-out', variant: 'destructive' as const },
  ]

  const projects = [
    { name: 'Core Engine v2', role: 'Architecture Lead', icon: 'i-lucide:cpu', branch: 'main' },
    {
      name: 'Design System',
      role: 'Core Maintainer',
      icon: 'i-lucide:palette',
      branch: 'release/v3',
    },
    {
      name: 'Customer Portal',
      role: 'Reviewer',
      icon: 'i-lucide:layout-template',
      branch: 'feature/auth',
    },
    {
      name: 'Analytics Pipeline',
      role: 'Contributor',
      icon: 'i-lucide:bar-chart-2',
      branch: 'trunk',
    },
  ]

  return (
    <div class="border border-border/70 bg-background h-96 w-full shadow-xs overflow-hidden rounded-xl">
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar class="border-r border-border/60 bg-card/40 w-60">
          {/* Header slot: Team Switcher Dropdown */}
          <SidebarFrame.SidebarHeader class="p-1.5 border-b border-border/60 flex h-12 items-center">
            <DropdownMenu>
              <DropdownMenu.Trigger
                as={Button}
                variant="ghost"
                class="px-2 py-1.5 h-auto w-full justify-between"
                trailing="i-lucide:chevrons-up-down"
              >
                <div class="text-left flex gap-2.5 min-w-0 items-center">
                  <div class="text-primary-foreground font-bold bg-primary flex shrink-0 size-7 items-center justify-center text-xs rounded-md">
                    <Icon name="i-lucide:gallery-vertical-end" class="size-3.5" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="leading-tight font-semibold truncate text-xs">
                      {currentTeam()}
                    </span>
                    <span class="text-[10px] text-muted-foreground leading-tight truncate">
                      Enterprise Tier
                    </span>
                  </div>
                </div>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content items={teamItems} />
            </DropdownMenu>
          </SidebarFrame.SidebarHeader>

          {/* Body slot: Projects list */}
          <SidebarFrame.SidebarBody class="p-2 space-y-1">
            <div class="text-[10px] text-muted-foreground tracking-wider font-semibold px-2 py-1 flex uppercase items-center justify-between">
              <span>Active Projects</span>
              <Badge size="sm" variant="outline">
                {projects.length}
              </Badge>
            </div>
            <For each={projects}>
              {(proj) => (
                <button
                  type="button"
                  onClick={() => setCurrentProject(proj.name)}
                  class={`px-2.5 py-2 text-left flex gap-2.5 w-full transition-colors items-center text-xs rounded-md ${
                    currentProject() === proj.name
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium'
                  }`}
                >
                  <Icon name={proj.icon} class="shrink-0 size-3.5" />
                  <span class="truncate">{proj.name}</span>
                </button>
              )}
            </For>
          </SidebarFrame.SidebarBody>

          {/* Footer slot: User Profile Dropdown */}
          <SidebarFrame.SidebarFooter class="p-2 border-t border-border/60">
            <DropdownMenu>
              <DropdownMenu.Trigger
                as={Button}
                variant="ghost"
                class="px-2 py-1.5 h-auto w-full justify-between"
                trailing="i-lucide:chevrons-up-down"
              >
                <div class="text-left flex gap-2 min-w-0 items-center">
                  <Avatar text="SC" size="sm" />
                  <div class="flex flex-col min-w-0">
                    <span class="leading-tight font-medium truncate text-xs">Sarah Connor</span>
                    <span class="text-[10px] text-muted-foreground leading-tight truncate">
                      sarah@acme.com
                    </span>
                  </div>
                </div>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content items={userItems} />
            </DropdownMenu>
          </SidebarFrame.SidebarFooter>
        </SidebarFrame.Sidebar>

        <SidebarFrame.Main class="flex flex-col overflow-hidden">
          <div class="px-5 border-b border-border/60 flex shrink-0 h-12 items-center justify-between">
            <div class="flex gap-2 items-center">
              <Icon name="i-lucide:folder-git-2" class="text-primary size-4" />
              <h3 class="font-bold text-sm">{currentProject()}</h3>
            </div>
            <Badge size="sm" variant="subtle">
              Active Repository
            </Badge>
          </div>

          <div class="p-5 flex-1 overflow-y-auto space-y-4">
            <p class="text-muted-foreground leading-relaxed text-xs">
              Real-time pipeline orchestration and workload routing system. Synchronized across
              production worker fleets.
            </p>

            <div class="gap-3 grid grid-cols-2">
              <div class="p-3 border border-border/60 bg-card/50 rounded-lg">
                <div class="text-[11px] text-muted-foreground">Current Branch</div>
                <div class="font-bold font-mono mt-1 flex gap-1.5 items-center text-xs">
                  <Icon name="i-lucide:git-branch" class="text-primary size-3" />
                  main
                </div>
              </div>
              <div class="p-3 border border-border/60 bg-card/50 rounded-lg">
                <div class="text-[11px] text-muted-foreground">Open Pull Requests</div>
                <div class="font-bold mt-1 flex gap-1.5 items-center text-xs">
                  <Icon name="i-lucide:git-pull-request" class="text-emerald-600 size-3" />4 ready
                  for merge
                </div>
              </div>
            </div>
          </div>

          <div class="text-muted-foreground px-5 py-2.5 border-t border-border/50 flex shrink-0 items-center justify-between text-xs">
            <span>Workspace: {currentTeam()}</span>
            <span>Last synced: just now</span>
          </div>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
