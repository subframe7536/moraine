import { Button, Icon, Resizable, Sidebar } from '@src'
import { For, Show } from 'solid-js'

function FileExplorerContent() {
  const files = [
    { name: 'src', type: 'folder-open', level: 0 },
    { name: 'components', type: 'folder', level: 1 },
    { name: 'navigation', type: 'folder-open', level: 1 },
    { name: 'sidebar.tsx', type: 'file-code', level: 2, active: true },
    { name: 'sidebar.recipe.ts', type: 'file-code', level: 2 },
    { name: 'index.ts', type: 'file-code', level: 1 },
    { name: 'package.json', type: 'file-json', level: 0 },
    { name: 'README.md', type: 'file-text', level: 0 },
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return 'i-lucide:folder'
      case 'folder-open':
        return 'i-lucide:folder-open'
      case 'file-json':
        return 'i-lucide:file-json'
      case 'file-text':
        return 'i-lucide:file-text'
      default:
        return 'i-lucide:file-code'
    }
  }

  return (
    <>
      <Sidebar.Header>
        <div class="flex w-full items-center justify-between">
          <span class="text-xs text-muted-foreground font-bold uppercase">Explorer: Moraine</span>
          <div class="flex gap-0.5 items-center">
            <Button variant="ghost" size="icon-xs" aria-label="New file">
              <Icon name="i-lucide:file-plus" />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label="Refresh explorer">
              <Icon name="i-lucide:refresh-cw" />
            </Button>
          </div>
        </div>
      </Sidebar.Header>

      <Sidebar.Content>
        <div class="p-2 space-y-0.5">
          <For each={files}>
            {(file) => (
              <div
                class={`text-xs px-2 py-1 rounded flex gap-2 items-center ${
                  file.active
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                style={{ 'padding-left': `${(file.level + 1) * 8}px` }}
              >
                <span class="shrink-0">
                  <Icon name={getIcon(file.type)} />
                </span>
                <span class="truncate">{file.name}</span>
              </div>
            )}
          </For>
        </div>
      </Sidebar.Content>
    </>
  )
}

function EditorContent() {
  return (
    <Sidebar.Inset>
      <div class="flex flex-col h-full">
        <div class="text-xs border-b border-border bg-muted flex shrink-0 h-9 items-center">
          <div class="font-medium px-3 border-r border-border border-t-2 border-t-primary bg-background flex gap-2 h-full items-center">
            <span class="text-primary">
              <Icon name="i-lucide:file-code" />
            </span>
            <span>sidebar.tsx</span>
            <span class="text-muted-foreground">
              <Icon name="i-lucide:x" />
            </span>
          </div>
          <div class="text-muted-foreground px-3 py-1.5 border-r border-border flex gap-2 items-center">
            <Icon name="i-lucide:file-code" />
            <span>index.ts</span>
          </div>
        </div>

        <div class="text-xs text-muted-foreground font-mono p-4 bg-background flex-1 overflow-auto space-y-1">
          <div>// Moraine responsive sidebar primitive</div>
          <div class="text-foreground">export function Sidebar(props: SidebarProps) {'{'}</div>
          <div class="text-foreground pl-4">
            const [local, rest] = splitProps(props, ['variant', 'side', 'isMobile'])
          </div>
          <div class="text-foreground pl-4">
            const {'{ slots }'} = useRecipe(sidebarRecipe, local)
          </div>
          <div class="text-foreground pl-4">return (</div>
          <div class="text-foreground pl-8">{'<SidebarProvider value={context}>'}</div>
          <div class="text-foreground pl-12">{'<div data-slot="sidebar" {...rest}>'}</div>
          <div class="text-foreground pl-16">{'{local.children}'}</div>
          <div class="text-foreground pl-12">{'</div>'}</div>
          <div class="text-foreground pl-8">{'</SidebarProvider>'}</div>
          <div class="text-foreground pl-4">)</div>
          <div class="text-foreground">{'}'}</div>
        </div>

        <div class="text-xs text-muted-foreground px-3 py-1 border-t border-border bg-muted flex shrink-0 items-center justify-between">
          <div class="flex gap-3 items-center">
            <span class="text-foreground font-medium flex gap-1 items-center">
              <Icon name="i-lucide:git-branch" />
              main*
            </span>
            <span>0 errors, 0 warnings</span>
          </div>
          <div class="flex gap-3 items-center">
            <span>TypeScript 5.8</span>
            <span>Ln 12, Col 24</span>
          </div>
        </div>
      </div>
    </Sidebar.Inset>
  )
}

function ResizableLayout() {
  const frame = Sidebar.useContext()

  return (
    <Show
      when={frame.isMobile()}
      fallback={
        <div class="flex-1 h-full">
          <Resizable defaultValue={['32%', '68%']}>
            <Resizable.Panel min={180} max={360} collapsible collapsibleMin={56}>
              <Sidebar.Panel>
                <FileExplorerContent />
              </Sidebar.Panel>
            </Resizable.Panel>
            <Resizable.Handle action="collapse" />
            <Resizable.Panel>
              <EditorContent />
            </Resizable.Panel>
          </Resizable>
        </div>
      }
    >
      <Sidebar.Panel>
        <FileExplorerContent />
      </Sidebar.Panel>
      <EditorContent />
    </Show>
  )
}

export function SheetResizableRender() {
  return (
    <div class="border border-border rounded-xl bg-background h-96 w-full overflow-hidden">
      <Sidebar width="100%">
        <ResizableLayout />
      </Sidebar>
    </div>
  )
}
