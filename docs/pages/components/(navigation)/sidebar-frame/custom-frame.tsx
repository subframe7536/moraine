import { Avatar, Badge, Button, Icon, SidebarFrame } from '@src'
import { For } from 'solid-js'

export function FrameRender() {
  const cloudNav = [
    { label: 'Kubernetes Clusters', icon: 'i-lucide:server', active: true },
    { label: 'Serverless Functions', icon: 'i-lucide:zap' },
    { label: 'Edge Storage', icon: 'i-lucide:database' },
    { label: 'Virtual Networks', icon: 'i-lucide:network' },
    { label: 'IAM & Security', icon: 'i-lucide:shield-check' },
    { label: 'Metrics & Observability', icon: 'i-lucide:activity' },
  ]

  const clusters = [
    { name: 'k8s-prod-primary', nodes: '48 nodes', region: 'us-east-1', health: 'Healthy' },
    { name: 'ingress-edge-mesh', nodes: '16 nodes', region: 'global-anycast', health: 'Healthy' },
    { name: 'db-replica-pool', nodes: '24 nodes', region: 'eu-west-1', health: 'Degraded' },
  ]

  return (
    <div class="border border-border/70 rounded-xl bg-background flex flex-col h-[400px] w-full shadow-xs overflow-hidden">
      {/* Global Topbar outside the SidebarFrame */}
      <header class="px-4 border-b border-border/70 bg-card/70 flex shrink-0 h-11 items-center justify-between">
        <div class="flex gap-3 items-center">
          <div class="text-xs font-bold flex gap-2 items-center">
            <div class="text-white rounded-md bg-blue-600 flex size-6 items-center justify-center">
              <Icon name="i-lucide:cloud" class="size-3.5" />
            </div>
            <span>HyperScale Cloud</span>
          </div>

          <div class="bg-border/60 h-4 w-px" />

          <button class="text-xs text-muted-foreground font-medium px-2 py-1 rounded-md bg-muted/50 flex gap-1.5 transition-colors items-center hover:text-foreground hover:bg-muted">
            <span>Project: prod-omega</span>
            <Icon name="i-lucide:chevron-down" class="size-3" />
          </button>
        </div>

        <div class="flex gap-2 items-center">
          <Button variant="ghost" size="icon-xs" aria-label="Cloud alarms">
            <div class="relative">
              <Icon name="i-lucide:bell" class="size-3.5" />
              <span class="rounded-full bg-amber-500 size-1.5 absolute -right-0.5 -top-0.5" />
            </div>
          </Button>
          <Avatar text="HC" size="sm" />
        </div>
      </header>

      {/* Embedded SidebarFrame taking remaining height */}
      <SidebarFrame isMobile={false} class="flex-1 h-auto min-h-0">
        <SidebarFrame.Sidebar class="border-r border-border/60 bg-card/30 w-56">
          <SidebarFrame.SidebarBody class="p-2 space-y-1">
            <div class="text-[10px] text-muted-foreground tracking-wider font-semibold px-2 py-1 uppercase">
              Infrastructure
            </div>
            <For each={cloudNav}>
              {(item) => (
                <a
                  href="#"
                  class={`text-xs font-medium px-2.5 py-1.5 rounded-md flex gap-2 transition-colors items-center ${
                    item.active
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <Icon name={item.icon} class="shrink-0 size-3.5" />
                  <span class="truncate">{item.label}</span>
                </a>
              )}
            </For>
          </SidebarFrame.SidebarBody>

          <SidebarFrame.SidebarFooter class="text-[11px] text-muted-foreground p-2 border-t border-border/60 flex items-center justify-between">
            <span>Region: us-east-1</span>
            <span class="rounded-full bg-emerald-500 size-2" />
          </SidebarFrame.SidebarFooter>
        </SidebarFrame.Sidebar>

        <SidebarFrame.Main class="p-4 overflow-y-auto space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold">Active Kubernetes Clusters</h3>
              <p class="text-xs text-muted-foreground">
                Manage and observe distributed workload clusters
              </p>
            </div>
            <Button size="xs" leading="i-lucide:plus">
              Provision Cluster
            </Button>
          </div>

          <div class="gap-3 grid grid-cols-3">
            <div class="p-2.5 border border-border/60 rounded-lg bg-card/60">
              <div class="text-[11px] text-muted-foreground">Total CPU Allocation</div>
              <div class="text-base font-bold mt-0.5">74%</div>
              <div class="mt-2 rounded-full bg-muted h-1.5 w-full overflow-hidden">
                <div class="rounded-full bg-blue-600 h-full w-3/4" />
              </div>
            </div>
            <div class="p-2.5 border border-border/60 rounded-lg bg-card/60">
              <div class="text-[11px] text-muted-foreground">Cluster Memory Pool</div>
              <div class="text-base font-bold mt-0.5">61%</div>
              <div class="mt-2 rounded-full bg-muted h-1.5 w-full overflow-hidden">
                <div class="rounded-full bg-indigo-600 h-full w-3/5" />
              </div>
            </div>
            <div class="p-2.5 border border-border/60 rounded-lg bg-card/60">
              <div class="text-[11px] text-muted-foreground">Network Ingress</div>
              <div class="text-base font-bold mt-0.5">1.4 Gbps</div>
              <div class="mt-2 rounded-full bg-muted h-1.5 w-full overflow-hidden">
                <div class="rounded-full bg-emerald-600 h-full w-2/5" />
              </div>
            </div>
          </div>

          <div class="border border-border/60 rounded-lg bg-card/50 overflow-hidden">
            <div class="divide-border/40 divide-y">
              <For each={clusters}>
                {(cluster) => (
                  <div class="text-xs px-3 py-2.5 flex items-center justify-between">
                    <div class="flex gap-2.5 items-center">
                      <Icon name="i-lucide:server" class="text-muted-foreground size-4" />
                      <div>
                        <div class="font-semibold">{cluster.name}</div>
                        <div class="text-[10px] text-muted-foreground">
                          {cluster.nodes} • {cluster.region}
                        </div>
                      </div>
                    </div>
                    <Badge
                      size="sm"
                      variant={cluster.health === 'Healthy' ? 'subtle' : 'outline'}
                      leading={
                        cluster.health === 'Healthy'
                          ? 'i-lucide:check-circle-2'
                          : 'i-lucide:alert-triangle'
                      }
                    >
                      {cluster.health}
                    </Badge>
                  </div>
                )}
              </For>
            </div>
          </div>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
