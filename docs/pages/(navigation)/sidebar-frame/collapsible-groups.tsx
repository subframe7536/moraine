import { Badge, Breadcrumb, Button, Collapsible, Icon, Separator, SidebarFrame } from '@src'
import { For, createSignal } from 'solid-js'

export function CollapsibleGroups() {
  const [activePage, setActivePage] = createSignal('Pages and Layouts')

  const breadcrumbItems = () => [
    { label: 'Documentation', href: '#' },
    { label: 'Application Architecture', href: '#' },
    { label: activePage() },
  ]

  return (
    <div class="border border-border/70 rounded-xl bg-background h-[420px] w-full shadow-xs overflow-hidden">
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar class="border-r border-border/60 bg-card/40 w-64">
          <SidebarFrame.SidebarHeader class="px-3 border-b border-border/60 flex h-11 items-center justify-between">
            <div class="text-xs font-bold flex gap-2 items-center">
              <div class="text-white rounded-md bg-emerald-600 flex size-6 items-center justify-center">
                <Icon name="i-lucide:book-open" class="size-3.5" />
              </div>
              <span>Framework Docs</span>
            </div>
            <Badge size="sm" variant="outline">
              v3.0
            </Badge>
          </SidebarFrame.SidebarHeader>

          <SidebarFrame.SidebarBody class="p-2 space-y-3">
            {/* Group 1: Getting Started */}
            <div class="space-y-1">
              <div class="text-[10px] text-muted-foreground tracking-wider font-semibold px-2 py-1 uppercase">
                Overview
              </div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setActivePage('Getting Started')
                }}
                class={`text-xs font-medium px-2.5 py-1.5 rounded-md flex gap-2 transition-colors items-center ${
                  activePage() === 'Getting Started'
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon name="i-lucide:compass" class="shrink-0 size-3.5" />
                <span>Getting Started</span>
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setActivePage('Quickstart')
                }}
                class={`text-xs font-medium px-2.5 py-1.5 rounded-md flex gap-2 transition-colors items-center ${
                  activePage() === 'Quickstart'
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon name="i-lucide:rocket" class="shrink-0 size-3.5" />
                <span>Quickstart</span>
              </a>
            </div>

            {/* Group 2: Collapsible Submenu - Architecture */}
            <div class="space-y-1">
              <div class="text-[10px] text-muted-foreground tracking-wider font-semibold px-2 py-1 uppercase">
                Architecture
              </div>

              {/* Collapsible 1: Routing */}
              <Collapsible defaultOpen transition>
                <Collapsible.Trigger class="group text-xs text-muted-foreground font-medium px-2.5 py-1.5 rounded-md flex w-full transition-colors items-center justify-between hover:text-foreground hover:bg-muted/60">
                  <div class="flex gap-2 items-center">
                    <Icon name="i-lucide:route" class="shrink-0 size-3.5" />
                    <span>Routing</span>
                  </div>
                  <Icon
                    name="i-lucide:chevron-right"
                    class="group-data-expanded:rotate-90 text-muted-foreground size-3 transition-transform duration-200"
                  />
                </Collapsible.Trigger>
                <Collapsible.Content class="ml-3 py-0.5 pl-4 border-l border-border/60 space-y-0.5">
                  <For each={['Defining Routes', 'Pages and Layouts', 'Navigation & Links']}>
                    {(item) => (
                      <button
                        type="button"
                        onClick={() => setActivePage(item)}
                        class={`text-xs px-2 py-1 text-left rounded w-full transition-colors ${
                          activePage() === item
                            ? 'text-primary font-semibold bg-accent/60'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        {item}
                      </button>
                    )}
                  </For>
                </Collapsible.Content>
              </Collapsible>

              {/* Collapsible 2: Data Fetching */}
              <Collapsible transition>
                <Collapsible.Trigger class="group text-xs text-muted-foreground font-medium px-2.5 py-1.5 rounded-md flex w-full transition-colors items-center justify-between hover:text-foreground hover:bg-muted/60">
                  <div class="flex gap-2 items-center">
                    <Icon name="i-lucide:database" class="shrink-0 size-3.5" />
                    <span>Data Fetching</span>
                  </div>
                  <Icon
                    name="i-lucide:chevron-right"
                    class="group-data-expanded:rotate-90 text-muted-foreground size-3 transition-transform duration-200"
                  />
                </Collapsible.Trigger>
                <Collapsible.Content class="ml-3 py-0.5 pl-4 border-l border-border/60 space-y-0.5">
                  <For each={['Server Actions', 'Streaming & Suspense', 'Caching & Revalidation']}>
                    {(item) => (
                      <button
                        type="button"
                        onClick={() => setActivePage(item)}
                        class={`text-xs px-2 py-1 text-left rounded w-full transition-colors ${
                          activePage() === item
                            ? 'text-primary font-semibold bg-accent/60'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        {item}
                      </button>
                    )}
                  </For>
                </Collapsible.Content>
              </Collapsible>
            </div>
          </SidebarFrame.SidebarBody>

          <SidebarFrame.SidebarFooter class="text-xs text-muted-foreground p-2.5 border-t border-border/60 flex items-center justify-between">
            <span class="text-[11px]">SolidJS v1.9 Ecosystem</span>
            <Icon name="i-lucide:external-link" class="opacity-60 size-3" />
          </SidebarFrame.SidebarFooter>
        </SidebarFrame.Sidebar>

        <SidebarFrame.Main class="flex flex-col">
          <header class="px-3 border-b border-border/60 flex shrink-0 gap-2 h-11 items-center">
            <SidebarFrame.Trigger
              as={Button}
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle navigation"
            >
              <Icon name="i-lucide:menu" class="size-4" />
            </SidebarFrame.Trigger>
            <Separator orientation="vertical" class="h-4" />
            <Breadcrumb items={breadcrumbItems()} />
          </header>

          <div class="p-5 flex-1 overflow-y-auto space-y-4">
            <div>
              <div class="text-xs text-primary font-semibold">Architecture / Routing</div>
              <h2 class="text-lg text-foreground font-bold mt-0.5">{activePage()}</h2>
              <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                Learn how nested layouts and leaf pages compose seamlessly in modern file-based
                routers without unnecessary re-renders.
              </p>
            </div>

            <div class="text-xs font-mono p-3 border border-border/60 rounded-lg bg-muted/30 space-y-1">
              <div class="text-muted-foreground">// Example page component definition</div>
              <div>
                <span class="text-purple-500">export default function</span>{' '}
                <span class="text-blue-500">Page</span>() {'{'}
              </div>
              <div class="pl-4">
                <span class="text-purple-500">return</span>{' '}
                <span class="text-emerald-600 dark:text-emerald-400">
                  {'<h1>Welcome to '}
                  {activePage()}
                  {'</h1>'}
                </span>
              </div>
              <div>{'}'}</div>
            </div>

            <div class="text-xs pt-3 border-t border-border/50 flex items-center justify-between">
              <Button variant="outline" size="xs" leading="i-lucide:arrow-left">
                Previous: Defining Routes
              </Button>
              <Button size="xs" trailing="i-lucide:arrow-right">
                Next: Navigation & Links
              </Button>
            </div>
          </div>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
