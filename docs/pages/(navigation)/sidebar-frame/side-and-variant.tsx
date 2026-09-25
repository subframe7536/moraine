import { Avatar, Badge, Button, Icon, Separator, SidebarFrame } from '@src'
import { For } from 'solid-js'

export function SideAndVariantUsage() {
  const reviewers = [
    { name: 'Sarah C.', approved: true },
    { name: 'David M.', approved: true },
    { name: 'Kenji S.', approved: false },
  ]

  const tags = ['Architecture', 'RFC', 'High Priority', 'v4.2']

  return (
    <div class="border border-border/70 bg-muted/20 h-96 w-full shadow-xs overflow-hidden rounded-xl">
      <SidebarFrame isMobile={false} side="right" variant="inset">
        <SidebarFrame.Sidebar class="bg-card/60 w-64">
          <SidebarFrame.SidebarHeader class="px-3 border-b border-border/60 flex h-11 items-center justify-between">
            <div class="flex gap-2 items-center">
              <Icon name="i-lucide:sliders-horizontal" class="text-muted-foreground size-3.5" />
              <span class="font-semibold text-xs">Document Inspector</span>
            </div>
            <Button variant="ghost" size="icon-xs" aria-label="Inspector options">
              <Icon name="i-lucide:more-horizontal" class="size-3.5" />
            </Button>
          </SidebarFrame.SidebarHeader>

          <SidebarFrame.SidebarBody class="p-3 space-y-4">
            <div class="space-y-1.5">
              <div class="text-[10px] text-muted-foreground tracking-wider font-semibold uppercase">
                Review Status
              </div>
              <div class="flex gap-2 items-center">
                <Badge variant="subtle" size="sm" leading="i-lucide:git-pull-request">
                  In Review (2/3)
                </Badge>
              </div>
            </div>

            <Separator class="my-2" />

            <div class="space-y-2">
              <div class="text-[10px] text-muted-foreground tracking-wider font-semibold uppercase">
                Document Owner
              </div>
              <div class="flex gap-2 items-center">
                <Avatar text="ER" size="sm" />
                <span class="font-medium text-xs">Elena Rostova</span>
              </div>
            </div>

            <div class="space-y-2">
              <div class="text-[10px] text-muted-foreground tracking-wider font-semibold uppercase">
                Design Reviewers
              </div>
              <div class="space-y-1.5">
                <For each={reviewers}>
                  {(reviewer) => (
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-muted-foreground">{reviewer.name}</span>
                      <Icon
                        name={reviewer.approved ? 'i-lucide:check-circle-2' : 'i-lucide:clock'}
                        class={`size-3.5 ${
                          reviewer.approved
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground/60'
                        }`}
                      />
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="text-[10px] text-muted-foreground tracking-wider font-semibold uppercase">
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
          </SidebarFrame.SidebarBody>

          <SidebarFrame.SidebarFooter class="p-3 border-t border-border/60 flex gap-2">
            <Button size="xs" variant="outline" class="flex-1">
              Changes
            </Button>
            <Button size="xs" class="flex-1">
              Approve
            </Button>
          </SidebarFrame.SidebarFooter>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main class="flex flex-col overflow-hidden">
          <div class="px-4 border-b border-border/60 flex shrink-0 h-11 items-center justify-between">
            <div class="flex gap-2 items-center">
              <Badge variant="subtle" size="sm">
                RFC-104
              </Badge>
              <span class="text-muted-foreground text-xs">Updated 14 minutes ago</span>
            </div>
            <span class="text-[11px] text-muted-foreground font-mono">SHA: 8f42c90</span>
          </div>

          <div class="p-4 flex-1 overflow-y-auto space-y-3">
            <div>
              <h3 class="text-foreground font-bold text-sm">
                Unified Distributed Cache Architecture
              </h3>
              <p class="text-muted-foreground leading-relaxed mt-1 text-xs">
                Proposed multi-region cache synchronization protocol for sub-millisecond edge reads
                and automated cache invalidation upon ledger updates.
              </p>
            </div>

            <div class="p-3 border border-border/70 bg-card space-y-2 rounded-lg">
              <div class="font-semibold flex gap-1.5 items-center text-xs">
                <Icon name="i-lucide:list-checks" class="text-primary size-4" />
                <span>Verification Requirements</span>
              </div>
              <ul class="text-muted-foreground pl-5 list-disc space-y-1 text-xs">
                <li>Under 5ms replication latency across tier-1 regional zones</li>
                <li>Zero cache poisoning on concurrent write split-brain failover</li>
                <li>Linear scaling up to 100,000 requests per node per second</li>
              </ul>
            </div>
          </div>

          <div class="text-muted-foreground px-4 py-2 border-t border-border/50 flex shrink-0 items-center justify-between text-xs">
            <span>Author: elena.rostova@distributed.io</span>
            <span>Target: v4.2-LTS</span>
          </div>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
