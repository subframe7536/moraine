import { Avatar, Badge, Breadcrumb, Button, Icon, Kbd, Separator, SidebarFrame } from '@src'
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
    <div class="border border-border/70 bg-background h-96 w-full shadow-xs overflow-hidden rounded-xl">
      <SidebarFrame>
        <SidebarFrame.Sidebar class="border-r border-border/60 bg-card/40">
          <SidebarFrame.SidebarHeader class="px-3 border-b border-border/60 flex h-11 items-center justify-between">
            <div class="flex gap-2.5 min-w-0 items-center">
              <div class="text-primary-foreground font-bold bg-primary flex shrink-0 size-7 items-center justify-center text-xs rounded-md">
                <Icon name="i-lucide:command" class="size-4" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="leading-tight font-semibold truncate text-xs">Acme Cloud</span>
                <span class="text-[10px] text-muted-foreground leading-tight truncate">
                  Production org
                </span>
              </div>
            </div>
            <Badge size="sm" variant="subtle">
              Pro
            </Badge>
          </SidebarFrame.SidebarHeader>

          <SidebarFrame.SidebarBody class="p-2 space-y-3">
            <div class="text-muted-foreground px-2.5 py-1.5 border border-border/60 bg-muted/30 flex w-full items-center justify-between text-xs rounded-md">
              <div class="flex gap-1.5 items-center">
                <Icon name="i-lucide:search" class="opacity-70 size-3.5" />
                <span>Search...</span>
              </div>
              <div class="flex gap-0.5 items-center">
                <Kbd size="sm" value="meta" />
                <Kbd size="sm" value="K" />
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-[10px] text-muted-foreground tracking-wider font-semibold px-2 py-1 uppercase">
                Platform
              </div>
              <For each={navPlatform}>
                {(item) => (
                  <a
                    href={item.href}
                    class={`font-medium px-2.5 py-1.5 flex transition-colors items-center justify-between text-xs rounded-md ${
                      item.active
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <div class="flex gap-2 min-w-0 items-center">
                      <Icon name={item.icon} class="shrink-0 size-3.5" />
                      <span class="truncate">{item.label}</span>
                    </div>
                    <Show when={item.badge}>
                      <Badge size="sm" variant="subtle">
                        {item.badge}
                      </Badge>
                    </Show>
                  </a>
                )}
              </For>
            </div>

            <div class="space-y-1">
              <div class="text-[10px] text-muted-foreground tracking-wider font-semibold px-2 py-1 uppercase">
                Configuration
              </div>
              <For each={navSettings}>
                {(item) => (
                  <a
                    href={item.href}
                    class="text-muted-foreground font-medium px-2.5 py-1.5 flex gap-2 transition-colors items-center text-xs rounded-md hover:text-foreground hover:bg-muted/60"
                  >
                    <Icon name={item.icon} class="shrink-0 size-3.5" />
                    <span class="truncate">{item.label}</span>
                  </a>
                )}
              </For>
            </div>
          </SidebarFrame.SidebarBody>

          <SidebarFrame.SidebarFooter class="p-2 border-t border-border/60 flex items-center justify-between">
            <div class="flex gap-2 min-w-0 items-center">
              <Avatar text="AR" size="sm" />
              <div class="flex flex-col min-w-0">
                <span class="leading-tight font-medium truncate text-xs">Alex Rivers</span>
                <span class="text-[10px] text-muted-foreground leading-tight truncate">
                  alex@acme.com
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon-xs" aria-label="User preferences">
              <Icon name="i-lucide:ellipsis-vertical" class="size-3.5" />
            </Button>
          </SidebarFrame.SidebarFooter>
        </SidebarFrame.Sidebar>

        <SidebarFrame.Main class="flex flex-col">
          <header class="px-3 border-b border-border/60 flex shrink-0 gap-2 h-11 items-center">
            <SidebarFrame.Trigger
              as={Button}
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle sidebar"
            >
              <Icon name="i-lucide:menu" class="size-4" />
            </SidebarFrame.Trigger>
            <Separator orientation="vertical" class="h-4" />
            <Breadcrumb items={breadcrumbItems} />
            <div class="flex-1" />
            <Button size="xs" leading="i-lucide:plus">
              New Deployment
            </Button>
          </header>

          <div class="p-4 flex-1 space-y-4">
            <div class="gap-2.5 grid grid-cols-3">
              <div class="p-2.5 border border-border/60 bg-card/60 rounded-lg">
                <div class="text-[11px] text-muted-foreground">Active Services</div>
                <div class="font-bold mt-0.5 text-base">24 / 24</div>
              </div>
              <div class="p-2.5 border border-border/60 bg-card/60 rounded-lg">
                <div class="text-[11px] text-muted-foreground">Global Uptime</div>
                <div class="text-emerald-600 font-bold mt-0.5 text-base dark:text-emerald-400">
                  99.98%
                </div>
              </div>
              <div class="p-2.5 border border-border/60 bg-card/60 rounded-lg">
                <div class="text-[11px] text-muted-foreground">Avg Latency</div>
                <div class="font-bold mt-0.5 text-base">42 ms</div>
              </div>
            </div>

            <div class="border border-border/60 bg-card/40 overflow-hidden rounded-lg">
              <div class="font-semibold px-3 py-2 border-b border-border/60 flex items-center justify-between text-xs">
                <span>Recent Deployments</span>
                <span class="text-[10px] text-muted-foreground font-normal">Auto-synced</span>
              </div>
              <div class="divide-border/40 divide-y">
                <For each={deployments}>
                  {(item) => (
                    <div class="px-3 py-2 flex items-center justify-between text-xs">
                      <div class="flex flex-col">
                        <span class="font-medium">{item.name}</span>
                        <span class="text-[10px] text-muted-foreground">{item.env}</span>
                      </div>
                      <div class="flex gap-2 items-center">
                        <Badge
                          size="sm"
                          variant={item.status === 'Live' ? 'subtle' : 'outline'}
                          leading={
                            item.status === 'Live'
                              ? 'i-lucide:check-circle-2'
                              : 'i-lucide:loader-circle'
                          }
                        >
                          {item.status}
                        </Badge>
                        <span class="text-[10px] text-muted-foreground">{item.time}</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
