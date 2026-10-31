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
    <div class="border border-border rounded-xl bg-background h-[420px] w-full overflow-hidden">
      <Sidebar isMobile={false}>
        <Sidebar.Panel>
          <Sidebar.Header>
            <div class="flex w-full items-center justify-between">
              <div class="text-xs font-bold flex gap-2 items-center">
                <div class="text-primary-foreground rounded-md bg-primary flex size-6 items-center justify-center">
                  <Icon name="i-lucide:book-open" />
                </div>
                <span>Framework Docs</span>
              </div>
              <Badge size="sm" variant="outline">
                v3.0
              </Badge>
            </div>
          </Sidebar.Header>

          <Sidebar.Content>
            <Sidebar.Group>
              <Sidebar.GroupLabel>Overview</Sidebar.GroupLabel>
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
              <Sidebar.GroupLabel>Architecture</Sidebar.GroupLabel>
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

          <Sidebar.Footer>
            <div class="text-xs text-muted-foreground flex w-full items-center justify-between">
              <span>SolidJS v1.9 Ecosystem</span>
              <Icon name="i-lucide:external-link" />
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
                aria-label="Toggle navigation"
              >
                <Icon name="i-lucide:menu" />
              </Sidebar.Trigger>
              <div class="h-4">
                <Separator orientation="vertical" />
              </div>
              <Breadcrumb items={breadcrumbItems()} />
            </header>

            <div class="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <div class="text-xs text-primary font-semibold">Architecture / Routing</div>
                <h2 class="text-lg text-foreground font-bold mt-0.5">{activePage()}</h2>
                <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                  Nested layouts and leaf pages compose in a file-based router.
                </p>
              </div>

              <div class="text-xs text-muted-foreground font-mono p-3 border border-border rounded-lg bg-muted space-y-1">
                <div>// Example page component</div>
                <div class="text-foreground">export default function Page() {'{'}</div>
                <div class="text-foreground pl-4">
                  return {'<h1>Welcome to '}
                  {activePage()}
                  {'</h1>'}
                </div>
                <div class="text-foreground">{'}'}</div>
              </div>

              <div class="pt-3 border-t border-border flex items-center justify-between">
                <Button variant="outline" size="xs" leading="i-lucide:arrow-left">
                  Previous: Defining Routes
                </Button>
                <Button size="xs" trailing="i-lucide:arrow-right">
                  Next: Navigation & Links
                </Button>
              </div>
            </div>
          </div>
        </Sidebar.Inset>
      </Sidebar>
    </div>
  )
}
