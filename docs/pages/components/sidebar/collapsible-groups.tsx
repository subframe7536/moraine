import { Badge, Breadcrumb, Button, Icon, Separator, Sidebar } from '@src'
import { For, createSignal } from 'solid-js'

export function CollapsibleGroups() {
  const [activePage, setActivePage] = createSignal('Pages and Layouts')

  const breadcrumbItems = () => [
    { label: 'Documentation', href: '#' },
    { label: 'Application Architecture', href: '#' },
    { label: activePage() },
  ]

  return (
    <div class="border border-border rounded-xl bg-background h-[420px] w-full shadow-xs overflow-hidden">
      <Sidebar isMobile={false}>
        <Sidebar.Panel class="border-r border-border/60 bg-card/40 w-64">
          <Sidebar.Header class="px-4 border-b border-border/60 h-11 justify-between">
            <div class="text-xs font-bold flex gap-2 items-center">
              <div class="text-white rounded-md bg-emerald-600 flex size-6 items-center justify-center">
                <Icon name="i-lucide:book-open" class="size-3.5" />
              </div>
              <span>Framework Docs</span>
            </div>
            <Badge size="sm" variant="outline">
              v3.0
            </Badge>
          </Sidebar.Header>

          <Sidebar.Content>
            <Sidebar.Group>
              <Sidebar.GroupLabel class="text-[10px] tracking-wider font-semibold uppercase">
                Overview
              </Sidebar.GroupLabel>
              <Sidebar.Menu>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton
                    leading="i-lucide:compass"
                    isActive={activePage() === 'Getting Started'}
                    onClick={() => setActivePage('Getting Started')}
                  >
                    Getting Started
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton
                    leading="i-lucide:rocket"
                    isActive={activePage() === 'Quickstart'}
                    onClick={() => setActivePage('Quickstart')}
                  >
                    Quickstart
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.Group>

            <Sidebar.Group>
              <Sidebar.GroupLabel class="text-[10px] tracking-wider font-semibold uppercase">
                Architecture
              </Sidebar.GroupLabel>
              <Sidebar.Menu>
                <Sidebar.MenuItem>
                  <Sidebar.MenuSub defaultOpen transition>
                    <Sidebar.MenuSubTrigger leading="i-lucide:route">
                      Routing
                    </Sidebar.MenuSubTrigger>
                    <Sidebar.MenuSubContent>
                      <For each={['Defining Routes', 'Pages and Layouts', 'Navigation & Links']}>
                        {(item) => (
                          <Sidebar.MenuItem>
                            <Sidebar.MenuButton
                              isActive={activePage() === item}
                              onClick={() => setActivePage(item)}
                            >
                              {item}
                            </Sidebar.MenuButton>
                          </Sidebar.MenuItem>
                        )}
                      </For>
                    </Sidebar.MenuSubContent>
                  </Sidebar.MenuSub>
                </Sidebar.MenuItem>

                <Sidebar.MenuItem>
                  <Sidebar.MenuSub transition>
                    <Sidebar.MenuSubTrigger leading="i-lucide:database">
                      Data Fetching
                    </Sidebar.MenuSubTrigger>
                    <Sidebar.MenuSubContent>
                      <For
                        each={['Server Actions', 'Streaming & Suspense', 'Caching & Revalidation']}
                      >
                        {(item) => (
                          <Sidebar.MenuItem>
                            <Sidebar.MenuButton
                              isActive={activePage() === item}
                              onClick={() => setActivePage(item)}
                            >
                              {item}
                            </Sidebar.MenuButton>
                          </Sidebar.MenuItem>
                        )}
                      </For>
                    </Sidebar.MenuSubContent>
                  </Sidebar.MenuSub>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.Group>
          </Sidebar.Content>

          <Sidebar.Footer class="text-xs text-muted-foreground px-4 py-2.5 border-t border-border/60 justify-between">
            <span class="text-[11px]">SolidJS v1.9 Ecosystem</span>
            <Icon name="i-lucide:external-link" class="opacity-60 size-3" />
          </Sidebar.Footer>
        </Sidebar.Panel>

        <Sidebar.Inset class="flex flex-col">
          <header class="px-3 border-b border-border/60 flex shrink-0 gap-2 h-11 items-center">
            <Sidebar.Trigger
              as={Button}
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle navigation"
            >
              <Icon name="i-lucide:menu" class="size-4" />
            </Sidebar.Trigger>
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
        </Sidebar.Inset>
      </Sidebar>
    </div>
  )
}
