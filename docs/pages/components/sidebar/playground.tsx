import { Avatar, Breadcrumb, Button, DropdownMenu, Icon, Separator, Sidebar } from '@src'
import { For, createSignal } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const teams = [
  { name: 'Acme Inc', logo: 'i-lucide:gallery-vertical-end', plan: 'Enterprise' },
  { name: 'Acme Corp.', logo: 'i-lucide:audio-waveform', plan: 'Startup' },
  { name: 'Evil Corp.', logo: 'i-lucide:command', plan: 'Free' },
] as const

const data = {
  user: { name: 'maple', email: 'm@example.com' },
  teams,
  navMain: [
    {
      title: 'Playground',
      icon: 'i-lucide:square-terminal',
      items: [
        { title: 'History', url: '#' },
        { title: 'Starred', url: '#' },
        { title: 'Settings', url: '#' },
      ],
    },
    {
      title: 'Models',
      icon: 'i-lucide:bot',
      defaultOpen: true,
      items: [
        { title: 'Genesis', url: '#' },
        { title: 'Explorer', url: '#' },
        { title: 'Quantum', url: '#' },
      ],
    },
    {
      title: 'Documentation',
      icon: 'i-lucide:book-open',
      defaultOpen: true,
      items: [
        { title: 'Introduction', url: '#' },
        { title: 'Get Started', url: '#' },
        { title: 'Tutorials', url: '#' },
        { title: 'Changelog', url: '#' },
      ],
    },
    {
      title: 'Settings',
      icon: 'i-lucide:settings-2',
      items: [
        { title: 'General', url: '#' },
        { title: 'Team', url: '#' },
        { title: 'Billing', url: '#' },
        { title: 'Limits', url: '#' },
      ],
    },
  ],
  projects: [
    { name: 'Design Engineering', url: '#', icon: 'i-lucide:frame' },
    { name: 'Sales & Marketing', url: '#', icon: 'i-lucide:pie-chart' },
    { name: 'Travel', url: '#', icon: 'i-lucide:map' },
  ],
}

const userMenuItems = [
  { label: 'Upgrade to Pro', icon: 'i-lucide:sparkles' },
  { type: 'separator' as const },
  { label: 'Account', icon: 'i-lucide:badge-check' },
  { label: 'Billing', icon: 'i-lucide:credit-card' },
  { label: 'Notifications', icon: 'i-lucide:bell' },
  { type: 'separator' as const },
  { label: 'Log out', icon: 'i-lucide:log-out', variant: 'danger' as const },
]

const projectMenuItems = [
  { label: 'View Project', icon: 'i-lucide:folder' },
  { label: 'Share Project', icon: 'i-lucide:forward' },
  { type: 'separator' as const },
  { label: 'Delete Project', icon: 'i-lucide:trash-2', variant: 'danger' as const },
]

export default function SidebarPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'default',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Floating', value: 'floating' },
            { label: 'Inset', value: 'inset' },
          ],
        },
        {
          kind: 'select',
          prop: 'side',
          label: 'Side',
          defaultValue: 'left',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
      ]}
    >
      {(props) => {
        const [activeTeam, setActiveTeam] = createSignal<(typeof data.teams)[number]>(data.teams[0])

        const teamMenuItems = () => [
          ...data.teams.map((team, index) => ({
            label: team.name,
            icon: team.logo,
            kbds: [`⌘${index + 1}`],
            onSelect: () => setActiveTeam(team),
          })),
          { type: 'separator' as const },
          { label: 'Add team', icon: 'i-lucide:plus', onSelect: () => {} },
        ]

        return (
          <div class="border border-border rounded-xl bg-card h-[520px] max-w-4xl w-full shadow-xs overflow-hidden">
            <Sidebar variant={props.variant} side={props.side} isMobile={false}>
              <Sidebar.Panel class="w-60">
                <Sidebar.Header>
                  <DropdownMenu placement="bottom" align="start">
                    <DropdownMenu.Trigger
                      as="button"
                      class="px-2 py-1 text-left outline-none rounded-lg flex gap-2 w-full transition-colors items-center overflow-hidden hover:bg-muted/60 group-data-[closed]/sidebar:cursor-pointer"
                    >
                      <div class="text-background rounded-lg bg-foreground flex shrink-0 size-8 items-center justify-center">
                        <Icon name={activeTeam().logo} class="size-4" />
                      </div>
                      <div class="text-left flex flex-1 flex-col min-w-0">
                        <span class="text-sm leading-tight font-semibold truncate">
                          {activeTeam().name}
                        </span>
                        <span class="text-xs text-muted-foreground leading-tight truncate">
                          {activeTeam().plan}
                        </span>
                      </div>
                      <Icon
                        name="i-lucide:chevrons-up-down"
                        class="text-muted-foreground ms-auto shrink-0 size-4"
                      />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                      topRender={
                        <div class="text-xs text-muted-foreground font-medium px-2 py-1.5">
                          Teams
                        </div>
                      }
                      items={teamMenuItems()}
                    />
                  </DropdownMenu>
                </Sidebar.Header>

                <Sidebar.Content>
                  <Sidebar.Group>
                    <Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
                    <Sidebar.Menu>
                      <For each={data.navMain}>
                        {(item) => (
                          <Sidebar.MenuItem>
                            <Sidebar.MenuSub defaultOpen={item.defaultOpen} transition>
                              <Sidebar.MenuSubTrigger leading={item.icon}>
                                {item.title}
                              </Sidebar.MenuSubTrigger>
                              <Sidebar.MenuSubContent>
                                <For each={item.items}>
                                  {(subItem) => (
                                    <Sidebar.MenuItem>
                                      <Sidebar.MenuButton href={subItem.url}>
                                        {subItem.title}
                                      </Sidebar.MenuButton>
                                    </Sidebar.MenuItem>
                                  )}
                                </For>
                              </Sidebar.MenuSubContent>
                            </Sidebar.MenuSub>
                          </Sidebar.MenuItem>
                        )}
                      </For>
                    </Sidebar.Menu>
                  </Sidebar.Group>

                  <Sidebar.Group>
                    <Sidebar.GroupLabel>Projects</Sidebar.GroupLabel>
                    <Sidebar.Menu>
                      <For each={data.projects}>
                        {(project) => (
                          <Sidebar.MenuItem class="group/menu-item">
                            <Sidebar.MenuButton leading={project.icon} class="pe-8">
                              {project.name}
                            </Sidebar.MenuButton>
                            <Sidebar.MenuAction>
                              <DropdownMenu placement="right" align="start">
                                <DropdownMenu.Trigger
                                  class="text-xs p-1 rounded-sm opacity-0 aria-expanded:(bg-muted opacity-100) hover:bg-muted group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100"
                                  aria-label={`More options for ${project.name}`}
                                >
                                  <Icon name="i-lucide:ellipsis" />
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content items={projectMenuItems} />
                              </DropdownMenu>
                            </Sidebar.MenuAction>
                          </Sidebar.MenuItem>
                        )}
                      </For>
                      <Sidebar.MenuItem>
                        <Sidebar.MenuButton
                          leading="i-lucide:ellipsis"
                          class="text-muted-foreground/70"
                        >
                          More
                        </Sidebar.MenuButton>
                      </Sidebar.MenuItem>
                    </Sidebar.Menu>
                  </Sidebar.Group>
                </Sidebar.Content>

                <Sidebar.Footer>
                  <DropdownMenu placement="top" align="start">
                    <DropdownMenu.Trigger
                      as="button"
                      class="px-2 py-1 text-left outline-none rounded-lg flex gap-2 w-full transition-colors items-center overflow-hidden hover:bg-muted/60 group-data-[closed]/sidebar:cursor-pointer"
                    >
                      <Avatar
                        alt={data.user.name}
                        fallback="i-lucide:user"
                        text="CN"
                        size="md"
                        class="shrink-0"
                      />
                      <div class="text-left flex flex-1 flex-col min-w-0">
                        <span class="text-sm leading-tight font-semibold truncate">
                          {data.user.name}
                        </span>
                        <span class="text-xs text-muted-foreground leading-tight truncate">
                          {data.user.email}
                        </span>
                      </div>
                      <Icon
                        name="i-lucide:chevrons-up-down"
                        class="text-muted-foreground ms-auto shrink-0 size-4"
                      />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                      topRender={
                        <div class="p-2 border-b border-border/50 flex gap-2 items-center">
                          <Avatar
                            alt={data.user.name}
                            fallback="i-lucide:user"
                            text="CN"
                            size="md"
                            class="shrink-0"
                          />
                          <div class="text-left flex flex-col min-w-0">
                            <span class="text-sm leading-tight font-semibold truncate">
                              {data.user.name}
                            </span>
                            <span class="text-xs text-muted-foreground leading-tight truncate">
                              {data.user.email}
                            </span>
                          </div>
                        </div>
                      }
                      items={userMenuItems}
                    />
                  </DropdownMenu>
                </Sidebar.Footer>
              </Sidebar.Panel>

              <Sidebar.Inset class="flex flex-1 flex-col min-h-0 overflow-y-auto">
                <div
                  role="banner"
                  class="px-4 border-b border-border/50 flex shrink-0 gap-2 h-12 items-center"
                >
                  <Sidebar.Trigger
                    as={Button}
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Toggle sidebar"
                  >
                    <Icon name="i-lucide:panel-left" class="size-4" />
                  </Sidebar.Trigger>
                  <Separator orientation="vertical" class="h-4" />
                  <Breadcrumb
                    items={[{ label: 'Overview', href: '#' }, { label: 'Data Fetching' }]}
                  />
                </div>
                <div class="p-4 flex flex-1 flex-col gap-4">
                  <div class="gap-4 grid grid-cols-3">
                    <div class="rounded-xl bg-muted/50 aspect-video" />
                    <div class="rounded-xl bg-muted/50 aspect-video" />
                    <div class="rounded-xl bg-muted/50 aspect-video" />
                  </div>
                  <div class="rounded-xl bg-muted/50 flex-1 min-h-48" />
                </div>
              </Sidebar.Inset>
            </Sidebar>
          </div>
        )
      }}
    </DocsPlayground>
  )
}
