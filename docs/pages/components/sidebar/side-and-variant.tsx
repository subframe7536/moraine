import { Avatar, Badge, Button, Icon, Separator, Sidebar } from '@src'
import { For } from 'solid-js'

export function SideAndVariantUsage() {
  const reviewers = [
    { name: 'Sarah C.', approved: true },
    { name: 'David M.', approved: true },
    { name: 'Kenji S.', approved: false },
  ]

  const tags = ['Architecture', 'RFC', 'High Priority', 'v4.2']

  return (
    <div class="border border-border rounded-xl bg-muted h-96 w-full overflow-hidden">
      <Sidebar isMobile={false} side="right" variant="inset" width="16rem">
        <Sidebar.Panel>
          <Sidebar.Header>
            <div class="flex w-full items-center justify-between">
              <div class="flex gap-2 items-center">
                <span class="text-muted-foreground">
                  <Icon name="i-lucide:sliders-horizontal" />
                </span>
                <span class="text-xs font-semibold">Document Inspector</span>
              </div>
              <Button variant="ghost" size="icon-xs" aria-label="Inspector options">
                <Icon name="i-lucide:more-horizontal" />
              </Button>
            </div>
          </Sidebar.Header>

          <Sidebar.Content>
            <div class="px-4 py-3 space-y-4">
              <div class="space-y-1.5">
                <div class="text-xs text-muted-foreground font-semibold uppercase">
                  Review Status
                </div>
                <Badge variant="soft" size="sm" leading="i-lucide:git-pull-request">
                  In Review (2/3)
                </Badge>
              </div>

              <Separator />

              <div class="space-y-2">
                <div class="text-xs text-muted-foreground font-semibold uppercase">
                  Document Owner
                </div>
                <div class="flex gap-2 items-center">
                  <Avatar text="ER" size="sm" />
                  <span class="text-xs font-medium">Elena Rostova</span>
                </div>
              </div>

              <div class="space-y-2">
                <div class="text-xs text-muted-foreground font-semibold uppercase">
                  Design Reviewers
                </div>
                <div class="space-y-1.5">
                  <For each={reviewers}>
                    {(reviewer) => (
                      <div class="text-xs flex items-center justify-between">
                        <span class="text-muted-foreground">{reviewer.name}</span>
                        <span class={reviewer.approved ? 'text-success' : 'text-muted-foreground'}>
                          <Icon
                            name={reviewer.approved ? 'i-lucide:check-circle-2' : 'i-lucide:clock'}
                          />
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="text-xs text-muted-foreground font-semibold uppercase">
                  Tags & Milestones
                </div>
                <div class="flex flex-wrap gap-1">
                  <For each={tags}>
                    {(tag) => (
                      <Badge size="sm" variant="outline">
                        {tag}
                      </Badge>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </Sidebar.Content>

          <Sidebar.Footer>
            <div class="flex gap-2 w-full">
              <Button size="xs" variant="outline">
                Changes
              </Button>
              <Button size="xs">Approve</Button>
            </div>
          </Sidebar.Footer>
        </Sidebar.Panel>
        <Sidebar.Inset>
          <div class="flex flex-col h-full overflow-hidden">
            <div class="px-4 border-b border-border flex shrink-0 h-11 items-center justify-between">
              <div class="flex gap-2 items-center">
                <Badge variant="soft" size="sm">
                  RFC-104
                </Badge>
                <span class="text-xs text-muted-foreground">Updated 14 minutes ago</span>
              </div>
              <span class="text-xs text-muted-foreground font-mono">SHA: 8f42c90</span>
            </div>

            <div class="p-4 flex-1 overflow-y-auto space-y-3">
              <div>
                <h3 class="text-sm text-foreground font-bold">
                  Unified Distributed Cache Architecture
                </h3>
                <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                  A multi-region cache synchronization protocol for low-latency edge reads and
                  automated invalidation on ledger updates.
                </p>
              </div>

              <div class="p-3 border border-border rounded-lg bg-card space-y-2">
                <div class="text-xs font-semibold flex gap-1.5 items-center">
                  <span class="text-primary">
                    <Icon name="i-lucide:list-checks" />
                  </span>
                  <span>Verification Requirements</span>
                </div>
                <ul class="text-xs text-muted-foreground pl-5 list-disc space-y-1">
                  <li>Replication latency under 5 ms across tier-1 regions</li>
                  <li>No cache poisoning on concurrent write split-brain failover</li>
                  <li>Linear scaling to 100,000 requests per node per second</li>
                </ul>
              </div>
            </div>

            <div class="text-xs text-muted-foreground px-4 py-2 border-t border-border flex shrink-0 items-center justify-between">
              <span>Author: elena.rostova@distributed.io</span>
              <span>Target: v4.2-LTS</span>
            </div>
          </div>
        </Sidebar.Inset>
      </Sidebar>
    </div>
  )
}
