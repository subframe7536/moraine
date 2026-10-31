import { Avatar, Badge, Breadcrumb, Button, Icon, Separator, Sidebar } from '@src'
import { For, Show } from 'solid-js'

export function ResponsiveUsage() {
  const breadcrumbItems = [
    { label: 'Acme Cloud', href: '#' },
    { label: 'Platform', href: '#' },
    { label: 'Deployments' },
  ]

  const navPlatform = [
    { label: 'Dashboard', icon: 'i-lucide:layout-dashboard', href: '#' },
    { label: 'Deployments', icon: 'i-lucide:rocket', href: '#', active: true, badge: '12' },
    { label: 'Analytics', icon: 'i-lucide:bar-chart-3', href: '#' },
    { label: 'Cloud Logs', icon: 'i-lucide:terminal', href: '#' },
  ]

  const navSettings = [
    { label: 'Team Members', icon: 'i-lucide:users', href: '#' },
    { label: 'API Keys', icon: 'i-lucide:key', href: '#' },
    { label: 'Billing & Usage', icon: 'i-lucide:credit-card', href: '#' },
  ]

  const deployments = [
    { name: 'api-gateway', env: 'Production • us-east-1', status: 'Live', time: '2m ago' },
    { name: 'auth-service', env: 'Staging • eu-west-1', status: 'Building', time: '5m ago' },
    { name: 'worker-pool', env: 'Production • us-west-2', status: 'Live', time: '18m ago' },
  ]

  return (
    <div class="border border-border rounded-xl bg-background h-96 w-full overflow-hidden">
      <Sidebar>
        <Sidebar.Panel>
          <Sidebar.Header>
            <div class="flex gap-2.5 min-w-0 w-full items-center justify-between">
              <div class="flex gap-2.5 min-w-0 items-center">
                <div class="text-primary-foreground rounded-md bg-primary flex shrink-0 size-7 items-center justify-center">
                  <Icon name="i-lucide:command" />
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-xs leading-tight font-semibold truncate">Acme Cloud</span>
                  <span class="text-xs text-muted-foreground leading-tight truncate">
                    Production org
                  </span>
                </div>
              </div>
              <Badge size="sm" variant="soft">
                Pro
              </Badge>
            </div>
          </Sidebar.Header>

          <Sidebar.Content>
            <Sidebar.Group>
              <Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
              <Sidebar.Menu>
                <For each={navPlatform}>
                  {(item) => (
                    <Sidebar.MenuItem>
                      <Sidebar.MenuButton
                        href={item.href}
                        leading={item.icon}
                        isActive={item.active}
                      >
                        <span class="flex-1 truncate">{item.label}</span>
                        <Show when={item.badge}>
                          <Badge size="sm" variant="soft">
                            {item.badge}
                          </Badge>
                        </Show>
                      </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                  )}
                </For>
              </Sidebar.Menu>
            </Sidebar.Group>

            <Sidebar.Group>
              <Sidebar.GroupLabel>Configuration</Sidebar.GroupLabel>
              <Sidebar.Menu>
                <For each={navSettings}>
                  {(item) => (
                    <Sidebar.MenuItem>
                      <Sidebar.MenuButton href={item.href} leading={item.icon}>
                        {item.label}
                      </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                  )}
                </For>
              </Sidebar.Menu>
            </Sidebar.Group>
          </Sidebar.Content>

          <Sidebar.Footer>
            <div class="flex gap-2 min-w-0 w-full items-center justify-between">
              <div class="flex gap-2 min-w-0 items-center">
                <Avatar text="AR" size="sm" />
                <div class="flex flex-col min-w-0">
                  <span class="text-xs leading-tight font-medium truncate">Alex Rivers</span>
                  <span class="text-xs text-muted-foreground leading-tight truncate">
                    alex@acme.com
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon-xs" aria-label="User preferences">
                <Icon name="i-lucide:ellipsis-vertical" />
              </Button>
            </div>
          </Sidebar.Footer>
        </Sidebar.Panel>

        <Sidebar.Inset>
          <div class="flex flex-col h-full">
            <header class="px-3 border-b border-border flex shrink-0 gap-2 h-11 items-center">
              <Sidebar.Trigger
                as={Button}
                variant="ghost"
                size="icon-sm"
                aria-label="Toggle sidebar"
              >
                <Icon name="i-lucide:menu" />
              </Sidebar.Trigger>
              <div class="h-4">
                <Separator orientation="vertical" />
              </div>
              <Breadcrumb items={breadcrumbItems} />
              <div class="flex-1" />
              <Button size="xs" leading="i-lucide:plus">
                New Deployment
              </Button>
            </header>

            <div class="p-4 flex-1 space-y-4">
              <div class="gap-2.5 grid grid-cols-3">
                <div class="p-2.5 border border-border rounded-lg bg-card">
                  <div class="text-xs text-muted-foreground">Active Services</div>
                  <div class="text-base font-bold mt-0.5">24 / 24</div>
                </div>
                <div class="p-2.5 border border-border rounded-lg bg-card">
                  <div class="text-xs text-muted-foreground">Global Uptime</div>
                  <div class="text-base font-bold mt-0.5">99.98%</div>
                </div>
                <div class="p-2.5 border border-border rounded-lg bg-card">
                  <div class="text-xs text-muted-foreground">Avg Latency</div>
                  <div class="text-base font-bold mt-0.5">42 ms</div>
                </div>
              </div>

              <div class="border border-border rounded-lg bg-card overflow-hidden">
                <div class="text-xs font-semibold px-3 py-2 border-b border-border flex items-center justify-between">
                  <span>Recent Deployments</span>
                  <span class="text-xs text-muted-foreground font-normal">Auto-synced</span>
                </div>
                <div class="divide-border divide-y">
                  <For each={deployments}>
                    {(item) => (
                      <div class="text-xs px-3 py-2 flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="font-medium">{item.name}</span>
                          <span class="text-muted-foreground">{item.env}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                          <Badge
                            size="sm"
                            variant={item.status === 'Live' ? 'soft' : 'outline'}
                            leading={
                              item.status === 'Live'
                                ? 'i-lucide:check-circle-2'
                                : 'i-lucide:loader-circle'
                            }
                          >
                            {item.status}
                          </Badge>
                          <span class="text-muted-foreground">{item.time}</span>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </div>
        </Sidebar.Inset>
      </Sidebar>
    </div>
  )
}
