import { Avatar, Badge, DropdownMenu, Icon, Sidebar } from '@src'
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
    { label: 'Add Workspace', icon: 'i-lucide:plus', onSelect: () => {} },
  ]

  const userItems = [
    { label: 'Account Settings', icon: 'i-lucide:settings' },
    { label: 'Billing & Invoices', icon: 'i-lucide:credit-card' },
    { label: 'Notifications', icon: 'i-lucide:bell' },
    { type: 'separator' as const },
    { label: 'Log out', icon: 'i-lucide:log-out', variant: 'danger' as const },
  ]

  const projects = [
    { name: 'Core Engine v2', icon: 'i-lucide:cpu' },
    { name: 'Design System', icon: 'i-lucide:palette' },
    { name: 'Customer Portal', icon: 'i-lucide:layout-template' },
    { name: 'Analytics Pipeline', icon: 'i-lucide:bar-chart-2' },
  ]

  return (
    <div class="border border-border rounded-xl bg-background h-96 w-full overflow-hidden">
      <Sidebar isMobile={false}>
        <Sidebar.Panel>
          <Sidebar.Header>
            <DropdownMenu>
              <DropdownMenu.Trigger
                as={Sidebar.MenuButton}
                leading="i-lucide:gallery-vertical-end"
                trailing="i-lucide:chevrons-up-down"
              >
                <span class="leading-tight flex flex-col min-w-0">
                  <span class="font-semibold truncate">{currentTeam()}</span>
                  <span class="text-xs text-muted-foreground truncate">Enterprise Tier</span>
                </span>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content items={teamItems} />
            </DropdownMenu>
          </Sidebar.Header>

          <Sidebar.Content>
            <Sidebar.Group>
              <Sidebar.GroupLabel>
                <span class="flex w-full items-center justify-between">
                  <span>Active Projects</span>
                  <Badge size="sm" variant="outline">
                    {projects.length}
                  </Badge>
                </span>
              </Sidebar.GroupLabel>
              <Sidebar.Menu>
                <For each={projects}>
                  {(proj) => (
                    <Sidebar.MenuItem>
                      <Sidebar.MenuButton
                        leading={proj.icon}
                        isActive={currentProject() === proj.name}
                        onClick={() => setCurrentProject(proj.name)}
                      >
                        {proj.name}
                      </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                  )}
                </For>
              </Sidebar.Menu>
            </Sidebar.Group>
          </Sidebar.Content>

          <Sidebar.Footer>
            <DropdownMenu>
              <DropdownMenu.Trigger as={Sidebar.MenuButton} trailing="i-lucide:chevrons-up-down">
                <Avatar text="SC" size="sm" />
                <span class="leading-tight flex flex-col min-w-0">
                  <span class="font-medium truncate">Sarah Connor</span>
                  <span class="text-xs text-muted-foreground truncate">sarah@acme.com</span>
                </span>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content items={userItems} />
            </DropdownMenu>
          </Sidebar.Footer>
        </Sidebar.Panel>

        <Sidebar.Inset>
          <div class="flex flex-col h-full overflow-hidden">
            <div class="px-5 border-b border-border flex shrink-0 h-12 items-center justify-between">
              <div class="flex gap-2 items-center">
                <span class="text-primary">
                  <Icon name="i-lucide:folder-git-2" />
                </span>
                <h3 class="text-sm font-bold">{currentProject()}</h3>
              </div>
              <Badge size="sm" variant="soft">
                Active Repository
              </Badge>
            </div>

            <div class="p-5 flex-1 overflow-y-auto space-y-4">
              <p class="text-xs text-muted-foreground leading-relaxed">
                Pipeline orchestration and workload routing, synchronized across production worker
                fleets.
              </p>

              <div class="gap-3 grid grid-cols-2">
                <div class="p-3 border border-border rounded-lg bg-card">
                  <div class="text-xs text-muted-foreground">Current Branch</div>
                  <div class="text-xs font-bold font-mono mt-1 flex gap-1.5 items-center">
                    <span class="text-primary">
                      <Icon name="i-lucide:git-branch" />
                    </span>
                    main
                  </div>
                </div>
                <div class="p-3 border border-border rounded-lg bg-card">
                  <div class="text-xs text-muted-foreground">Open Pull Requests</div>
                  <div class="text-xs font-bold mt-1 flex gap-1.5 items-center">
                    <span class="text-success">
                      <Icon name="i-lucide:git-pull-request" />
                    </span>
                    4 ready for merge
                  </div>
                </div>
              </div>
            </div>

            <div class="text-xs text-muted-foreground px-5 py-2.5 border-t border-border flex shrink-0 items-center justify-between">
              <span>Workspace: {currentTeam()}</span>
              <span>Last synced: just now</span>
            </div>
          </div>
        </Sidebar.Inset>
      </Sidebar>
    </div>
  )
}
