import { Avatar, Badge, Button, Icon, Sidebar } from '@src'
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
    <div class="border border-border rounded-xl bg-background flex flex-col h-[400px] w-full overflow-hidden">
      {/* Global topbar outside the Sidebar frame */}
      <header class="px-4 border-b border-border bg-card flex shrink-0 h-11 items-center justify-between">
        <div class="flex gap-3 items-center">
          <div class="text-xs font-bold flex gap-2 items-center">
            <div class="text-primary-foreground rounded-md bg-primary flex size-6 items-center justify-center">
              <Icon name="i-lucide:cloud" />
            </div>
            <span>HyperScale Cloud</span>
          </div>

          <div class="bg-border h-4 w-px" />

          <button class="text-xs text-muted-foreground font-medium px-2 py-1 rounded-md bg-muted flex gap-1.5 items-center hover:text-foreground">
            <span>Project: prod-omega</span>
            <Icon name="i-lucide:chevron-down" />
          </button>
        </div>

        <div class="flex gap-2 items-center">
          <Button variant="ghost" size="icon-xs" aria-label="Cloud alarms">
            <Icon name="i-lucide:bell" />
          </Button>
          <Avatar text="HC" size="sm" />
        </div>
      </header>

      {/* Sidebar fills the remaining height below the topbar */}
      <div class="flex-1 min-h-0">
        <Sidebar isMobile={false} width="14rem">
          <Sidebar.Panel>
            <Sidebar.Content>
              <Sidebar.Group>
                <Sidebar.GroupLabel>Infrastructure</Sidebar.GroupLabel>
                <Sidebar.Menu>
                  <For each={cloudNav}>
                    {(item) => (
                      <Sidebar.MenuItem>
                        <Sidebar.MenuButton href="#" leading={item.icon} isActive={item.active}>
                          {item.label}
                        </Sidebar.MenuButton>
                      </Sidebar.MenuItem>
                    )}
                  </For>
                </Sidebar.Menu>
              </Sidebar.Group>
            </Sidebar.Content>

            <Sidebar.Footer>
              <div class="text-xs text-muted-foreground flex w-full items-center justify-between">
                <span>Region: us-east-1</span>
                <span class="rounded-full bg-success size-2" />
              </div>
            </Sidebar.Footer>
          </Sidebar.Panel>

          <Sidebar.Inset>
            <div class="p-4 space-y-4">
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
                <div class="p-2.5 border border-border rounded-lg bg-card">
                  <div class="text-xs text-muted-foreground">Total CPU Allocation</div>
                  <div class="text-base font-bold mt-0.5">74%</div>
                  <div class="mt-2 rounded-full bg-muted h-1.5 w-full overflow-hidden">
                    <div class="rounded-full bg-primary h-full w-3/4" />
                  </div>
                </div>
                <div class="p-2.5 border border-border rounded-lg bg-card">
                  <div class="text-xs text-muted-foreground">Cluster Memory Pool</div>
                  <div class="text-base font-bold mt-0.5">61%</div>
                  <div class="mt-2 rounded-full bg-muted h-1.5 w-full overflow-hidden">
                    <div class="rounded-full bg-primary h-full w-3/5" />
                  </div>
                </div>
                <div class="p-2.5 border border-border rounded-lg bg-card">
                  <div class="text-xs text-muted-foreground">Network Ingress</div>
                  <div class="text-base font-bold mt-0.5">1.4 Gbps</div>
                  <div class="mt-2 rounded-full bg-muted h-1.5 w-full overflow-hidden">
                    <div class="rounded-full bg-success h-full w-2/5" />
                  </div>
                </div>
              </div>

              <div class="border border-border rounded-lg bg-card overflow-hidden">
                <div class="divide-border divide-y">
                  <For each={clusters}>
                    {(cluster) => (
                      <div class="text-xs px-3 py-2.5 flex items-center justify-between">
                        <div class="flex gap-2.5 items-center">
                          <span class="text-muted-foreground">
                            <Icon name="i-lucide:server" />
                          </span>
                          <div>
                            <div class="font-semibold">{cluster.name}</div>
                            <div class="text-xs text-muted-foreground">
                              {cluster.nodes} • {cluster.region}
                            </div>
                          </div>
                        </div>
                        <Badge
                          size="sm"
                          variant={cluster.health === 'Healthy' ? 'soft' : 'outline'}
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
            </div>
          </Sidebar.Inset>
        </Sidebar>
      </div>
    </div>
  )
}
